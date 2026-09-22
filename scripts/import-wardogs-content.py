#!/usr/bin/env python3
"""从公开的 WARDOGS 站点抓取文章快照；需要 requests 和 beautifulsoup4。"""

import html
import json
import sys
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree

import requests
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1] / "sites/wardogs/content/wiki/en"
DATA = ROOT.parents[2] / "data"
PUBLIC = ROOT.parents[2] / "public/media"
BASE = "https://www.wardogs.top"
MAPS = {"wardogs-map", "wardogs-bakurani-map", "wardogs-ozeti-map", "wardogs-zestafona-map"}
UPDATES = {
    "wardogs-release-date", "wardogs-beta", "wardogs-playtest",
    "wardogs-playtest-gameplay", "wardogs-playtest-troubleshooting",
    "wardogs-100k-clip-contest", "wardogs-monetization", "wardogs-price",
    "wardogs-system-requirements", "wardogs-ps5-xbox-console",
    "wardogs-roadmap", "wardogs-planned-content", "wardogs-development-updates",
    "wardogs-patch-notes",
}


def clean(value):
    return html.escape(" ".join(value.split()), quote=False)


def content(section):
    columns = section.find_all("div", recursive=False)
    body = columns[-1] if columns else section
    lines = []
    status = body.select_one(".status")
    if status:
        lines.append(f"**Source status: {clean(status.get_text(' ', strip=True))}.**")
    for node in body.find_all(["h2", "h3", "p", "ul", "ol", "table"], recursive=False):
        if node.name in ("h2", "h3"):
            lines.append(f"{'##' if node.name == 'h2' else '###'} {clean(node.get_text(' ', strip=True))}")
        elif node.name == "p":
            lines.append(clean(node.get_text(" ", strip=True)))
        elif node.name in ("ul", "ol"):
            for item in node.find_all("li", recursive=False):
                lines.append(f"- {clean(item.get_text(' ', strip=True))}")
        elif node.name == "table":
            for row in node.find_all("tr"):
                cells = [clean(cell.get_text(" ", strip=True)) for cell in row.find_all(["th", "td"])]
                if cells:
                    lines.append(" | ".join(cells))
    return "\n\n".join(lines)


def structured_sections(main_node):
    blocks = []
    tracker = main_node.select_one(".roadmap-tracker-list")
    if tracker:
        lines = ["## Roadmap status tracker", "Status checked September 14, 2026. Announced work is not a released feature."]
        for item in tracker.find_all("article", recursive=False):
            title = item.find("h3")
            status = item.select_one(".status")
            date = item.find("strong")
            detail = item.find("p")
            if title and status:
                lines.append(f"- **{clean(title.get_text(' ', strip=True))} — {clean(status.get_text(' ', strip=True))}** ({clean(date.get_text(' ', strip=True)) if date else 'No date'}): {clean(detail.get_text(' ', strip=True)) if detail else ''}")
        blocks.append("\n\n".join(lines))
    timeline = main_node.select_one(".playtest-timeline")
    if timeline:
        lines = ["## Playtest timeline"]
        for item in timeline.find_all("li", recursive=False):
            title = item.find("h3")
            date = item.find("time")
            detail = item.find("p")
            if title:
                lines.append(f"- **{clean(date.get_text(' ', strip=True)) if date else 'Date not stated'} — {clean(title.get_text(' ', strip=True))}**: {clean(detail.get_text(' ', strip=True)) if detail else ''}")
        blocks.append("\n\n".join(lines))
    videos = main_node.select_one(".playtest-video-grid")
    if videos:
        lines = ["## Playtest gameplay videos", "These clips show historical beta gameplay, not verified Early Access balance."]
        for item in videos.find_all("article", recursive=False):
            title = item.find("h3")
            detail = item.find("p")
            source = item.find("a", href=True)
            if title and source:
                lines.append(f"- **{clean(title.get_text(' ', strip=True))}**: {clean(detail.get_text(' ', strip=True)) if detail else ''} [Source video]({source['href']}).")
        blocks.append("\n\n".join(lines))
    return blocks


def main():
    refresh = "--refresh" in sys.argv[1:]
    if any(arg != "--refresh" for arg in sys.argv[1:]):
        raise SystemExit("用法: python3 scripts/import-wardogs-content.py [--refresh]")
    session = requests.Session()
    sitemap = ElementTree.fromstring(session.get(f"{BASE}/sitemap.xml", timeout=15).text)
    pages = [(item.findtext("{*}loc"), item.findtext("{*}lastmod")) for item in sitemap]
    for url, modified in pages:
        slug = urlparse(url).path.strip("/")
        if not slug:
            continue
        category = "maps" if slug in MAPS else "weapons" if slug == "wardogs-weapons" else "updates" if slug in UPDATES else "guides"
        target = ROOT / category / f"{slug}.mdx"
        if target.exists() and (not refresh or "**Source snapshot:** Public WARDOGS Field Guide" not in target.read_text(encoding="utf-8")):
            raise RuntimeError(f"拒绝覆盖现有文章: {target}；刷新导入快照请显式传 --refresh")
        response = session.get(url, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        main_node = soup.find("main")
        title = main_node.find("h1").get_text(" ", strip=True)
        description = soup.find("meta", attrs={"name": "description"})["content"]
        sections = [content(section) for section in main_node.select("article.article-content section.article-section")]
        sections = [section for section in sections if section]
        faq = []
        for detail in main_node.select(".faq-block details"):
            question = detail.find("summary")
            answer = detail.find("p")
            if question and answer:
                faq.append({"question": question.get_text(" ", strip=True), "answer": answer.get_text(" ", strip=True)})
        sources = []
        for anchor in main_node.select(".sources-block ol li a[href]"):
            href = anchor["href"]
            if href.startswith("https://") and not any(item[1] == href for item in sources):
                sources.append((anchor.get_text(" ", strip=True), href))
        frontmatter = [
            "---", f"title: {json.dumps(title, ensure_ascii=False)}",
            f"description: {json.dumps(description, ensure_ascii=False)}",
            f"category: {json.dumps(category)}", f"date: {modified[:10]}",
            f"lastModified: {modified[:10]}",
            'author: "WARDOGS Field Guide"',
            f"tags: {json.dumps([category, 'early-access'])}",
        ]
        if faq:
            frontmatter.append(f"faq: {json.dumps(faq, ensure_ascii=False)}")
        frontmatter.append("---")
        notice = (
            "**Source snapshot:** Public WARDOGS Field Guide, reviewed September 14, 2026. "
            "Official announcements and historical community test-build data are distinct; "
            "prices, availability and planned features may change."
        )
        references = "\n\n".join(f"- [{clean(label)}]({source})" for label, source in sources)
        related = []
        for anchor in main_node.select(".related-panel a[href], .playtest-hub-links a[href], .map-switcher a[href]"):
            href = anchor["href"]
            if href.startswith("/wardogs-") or href == "/what-is-wardogs/":
                if href != urlparse(url).path and href not in [item[1] for item in related]:
                    related.append((anchor.get_text(" ", strip=True).replace("Open →", "").strip(), href))
        for label, href in (("Beginner Guide", "/wardogs-beginner-guide/"),
                            ("Weapons", "/wardogs-weapons/"),
                            ("Roadmap", "/wardogs-roadmap/"),
                            ("Maps", "/wardogs-map/")):
            if len(related) >= 3:
                break
            if href != urlparse(url).path and href not in [item[1] for item in related]:
                related.append((label, href))
        related_text = "\n\n".join(f"- [{clean(label)}]({href})" for label, href in related[:5])
        extra = ""
        component_import = ""
        if slug == "wardogs-weapons":
            component_import = 'import WeaponCatalogue from "../../../../components/WeaponCatalogue.astro";'
            extra = '<WeaponCatalogue />'
        elif slug in MAPS and slug != "wardogs-map":
            name = slug.removeprefix("wardogs-").removesuffix("-map")
            component_import = 'import MapAtlas from "../../../../components/MapAtlas.astro";'
            extra = f'<MapAtlas name="{name}" />'
        elif slug == "wardogs-map":
            extra = '\n'.join(f'- [{name.title()} terrain atlas](/wardogs-{name}-map/)' for name in ("bakurani", "ozeti", "zestafona"))
        body = "\n\n".join(filter(None, [component_import, notice, extra, *structured_sections(main_node), *sections,
                                               "## Related briefings", related_text,
                                               "## Sources and references", references or f"- [Original field guide]({url})"]))
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("\n".join(frontmatter) + "\n\n" + body + "\n", encoding="utf-8")
        print(f"{category}/{slug}: {len(sections)} sections, {len(sources)} sources")

        if slug == "wardogs-weapons":
            weapons = []
            for item in main_node.select(".weapon-catalogue .armory-catalogue-list details"):
                summary = item.find("summary")
                stats = {row.dt.get_text(" ", strip=True): row.dd.get_text(" ", strip=True)
                         for row in item.select(".armory-stats > div") if row.dt and row.dd}
                source = item.select_one(".armory-catalogue-detail a[href]")
                weapons.append({
                    "name": summary.strong.get_text(" ", strip=True),
                    "category": summary.small.get_text(" ", strip=True).split(" · ")[0],
                    "calibre": summary.small.get_text(" ", strip=True).split(" · ")[-1],
                    "price": summary.find_all("span", recursive=False)[-1].get_text(" ", strip=True).replace("＋", "").strip(),
                    "stats": stats,
                    "source": source["href"] if source else "",
                })
            DATA.mkdir(parents=True, exist_ok=True)
            (DATA / "weapons.json").write_text(json.dumps(weapons, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        if slug in MAPS and slug != "wardogs-map":
            name = slug.removeprefix("wardogs-").removesuffix("-map")
            markers = []
            for marker in main_node.select(".terrain-marker"):
                style = marker.get("style", "")
                marker_name = marker.get("title", "")
                if not marker_name:
                    continue
                markers.append({"name": marker_name, "grid": marker.get("aria-label", "").split("grid ")[-1],
                                "left": float(style.split("left:")[-1].split("%")[0]),
                                "top": float(style.split("top:")[-1].split("%")[0])})
            DATA.mkdir(parents=True, exist_ok=True)
            (DATA / f"{name}-locations.json").write_text(json.dumps(markers, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    assets = {
        "hero-teaser.jpg": "/media/clips/hero-teaser.jpg",
        "wardogs-hero.png": "/media/wardogs-hero.png",
        **{f"clips/{name}.jpg": f"/media/clips/{name}.jpg" for name in (
            "01-intro", "02-the-goal", "03-cash-system", "04-progression-and-classes",
            "05-fobs", "06-loadouts", "07-mechanics-and-tips", "08-future-systems")},
        **{f"maps/{name}.webp": f"/media/maps/{name}/overview.webp" for name in ("bakurani", "ozeti", "zestafona")},
        **{f"weapons/{name}.webp": f"/media/weapons/{name}-clean.webp" for name in ("m4", "ak74", "fal", "mp5", "m249-saw", "mosin-nagant", "m500", "rpg7")},
    }
    for local, remote in assets.items():
        target = PUBLIC / local
        if target.exists():
            continue
        response = session.get(f"{BASE}{remote}", timeout=15)
        response.raise_for_status()
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(response.content)
        print(f"asset: {local} ({len(response.content)} bytes)")


if __name__ == "__main__":
    main()
