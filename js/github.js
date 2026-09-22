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
    if (res.status === 401) throw new Error("GitHub rejected the token (401). Check it's correct and not expired.");
    if (res.status === 403) throw new Error("GitHub token doesn't have access (403)." + (detail ? " " + detail : ""));
    if (res.status === 404) throw new Error("Repo or ref not found (404). Check the token has access to " + GITHUB_OWNER + "/" + GITHUB_REPO + ".");
    throw new Error("GitHub API error (" + res.status + ")" + (detail ? ": " + detail : ""));
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
async function commitFilesToGitHub(token, files, message) {
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
