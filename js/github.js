// Thin GitHub REST API client used by the "Publish to GitHub" flow (see
// publish.js). Runs entirely in the browser — the CMS owner pastes in a
// personal access token (kept in sessionStorage, or localStorage if they
// tick "remember"), and we use it to commit content/images straight to the
// live repo via the Git Data API. This is the same approach git-backed CMS
// tools (Netlify/Decap CMS, etc.) use for a backend-less setup.

const GITHUB_OWNER = "nadyarizka";
const GITHUB_REPO = "nadyarizka.github.io";
const GITHUB_BRANCH = "main";
const GITHUB_API = "https://api.github.com";

const GH_TOKEN_SESSION_KEY = "nadyaGhTokenSession";
const GH_TOKEN_LOCAL_KEY = "nadyaGhTokenRemember";

function getGithubToken() {
  try {
    return sessionStorage.getItem(GH_TOKEN_SESSION_KEY) || localStorage.getItem(GH_TOKEN_LOCAL_KEY) || "";
  } catch (e) {
    return "";
  }
}

function hasRememberedGithubToken() {
  try {
    return !!localStorage.getItem(GH_TOKEN_LOCAL_KEY);
  } catch (e) {
    return false;
  }
}

function setGithubToken(token, remember) {
  try {
    sessionStorage.setItem(GH_TOKEN_SESSION_KEY, token);
  } catch (e) {
    // ignore — worst case the token only lives in localStorage below
  }
  try {
    if (remember) localStorage.setItem(GH_TOKEN_LOCAL_KEY, token);
    else localStorage.removeItem(GH_TOKEN_LOCAL_KEY);
  } catch (e) {
    // ignore
  }
}

function clearGithubToken() {
  try {
    sessionStorage.removeItem(GH_TOKEN_SESSION_KEY);
  } catch (e) {}
  try {
    localStorage.removeItem(GH_TOKEN_LOCAL_KEY);
  } catch (e) {}
}

function ghHeaders(token) {
  return {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

async function ghRequest(token, method, path, body) {
  const res = await fetch(GITHUB_API + path, {
    method,
    headers: ghHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j && j.message ? j.message : "";
    } catch (e) {
      // response wasn't JSON — fall through with no detail
    }
    let message;
    if (res.status === 401) message = "GitHub rejected the token (401). Check it's correct and not expired.";
    else if (res.status === 403) message = "GitHub token doesn't have access (403)." + (detail ? " " + detail : "");
    else if (res.status === 404) message = "Repo or ref not found (404). Check the token has access to " + GITHUB_OWNER + "/" + GITHUB_REPO + ".";
    else message = "GitHub API error (" + res.status + ")" + (detail ? ": " + detail : "");
    const err = new Error(message);
    err.status = res.status;
    // 409 is always a concurrency conflict. 422 is GitHub's general
    // validation-error status, so only treat it as a (retryable) race when
    // the message is specifically the known non-fast-forward ref signature —
    // otherwise a real 422 (malformed request) would get silently retried
    // and its actual cause delayed instead of surfaced.
    err.isConflict = res.status === 409 || (res.status === 422 && /fast.forward/i.test(message));
    throw err;
  }
  return res.json();
}

// Confirms the token can actually reach the repo before we let the user rely
// on it. Fine-grained tokens don't always expose `permissions`, so a visible
// repo is treated as good enough — the real check happens on first publish.
async function verifyGithubToken(token) {
  const json = await ghRequest(token, "GET", `/repos/${GITHUB_OWNER}/${GITHUB_REPO}`);
  if (json && json.permissions && typeof json.permissions.push === "boolean") {
    return json.permissions.push;
  }
  return true;
}

// Commits several files in one atomic push using the Git Data API (blobs +
// tree + commit + ref update), so a publish either fully lands or fully
// fails — never a half-committed state, and only one Pages build gets
// triggered no matter how many files changed.
//   files: [{ path, content, encoding: "utf-8" | "base64" }]
//
// Retries on a non-fast-forward conflict — someone/something else (another
// tab, an auto-publish overlapping a manual one, etc.) moved the branch
// between when we read it and when we tried to update it. Re-reading the
// branch and rebuilding the commit on top of it is the correct fix (not a
// force-push), and it's safe to retry blindly since nothing has been written
// until the very last step (the ref update) succeeds.
async function commitFilesToGitHub(token, files, message) {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptCommitToGitHub(token, files, message);
    } catch (err) {
      if (!err.isConflict || attempt === MAX_ATTEMPTS) throw err;
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt + Math.random() * 250));
    }
  }
}

async function attemptCommitToGitHub(token, files, message) {
  const refData = await ghRequest(token, "GET", `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${GITHUB_BRANCH}`);
  const latestCommitSha = refData.object.sha;

  const commitData = await ghRequest(token, "GET", `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits/${latestCommitSha}`);
  const baseTreeSha = commitData.tree.sha;

  const treeItems = [];
  for (const f of files) {
    if (f.encoding === "base64") {
      const blob = await ghRequest(token, "POST", `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/blobs`, {
        content: f.content,
        encoding: "base64",
      });
      treeItems.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
    } else {
      treeItems.push({ path: f.path, mode: "100644", type: "blob", content: f.content });
    }
  }

  const treeData = await ghRequest(token, "POST", `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees`, {
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  const newCommit = await ghRequest(token, "POST", `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits`, {
    message,
    tree: treeData.sha,
    parents: [latestCommitSha],
  });

  await ghRequest(token, "PATCH", `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`, {
    sha: newCommit.sha,
  });

  return newCommit.sha;
}
