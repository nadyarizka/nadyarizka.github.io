source "https://rubygems.org"

# GitHub Pages builds your site automatically with this gem.
# You do NOT need to run anything locally — GitHub does it for you.
gem "github-pages", group: :jekyll_plugins

# Ruby 3.4+/4.x removed these from the default gems; github-pages'
# pinned Jekyll version still needs them for local `bundle exec jekyll serve`.
gem "csv"
gem "logger"
gem "base64"
gem "bigdecimal"

# Plugins used by the site (all supported by GitHub Pages)
group :jekyll_plugins do
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
  gem "jekyll-feed"
end

# Windows / JRuby compatibility (harmless elsewhere)
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
