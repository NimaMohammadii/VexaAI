"""Utilities for downloading media from Instagram posts and reels."""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from typing import Iterable, List
from urllib.parse import urlparse

import requests

__all__ = [
    "InstagramDownloadError",
    "MediaItem",
    "extract_instagram_urls",
    "fetch_instagram_media",
]

LOGGER = logging.getLogger(__name__)

INSTAGRAM_HOSTS = {"instagram.com", "www.instagram.com"}
INSTAGRAM_PATH_PATTERN = re.compile(r"^(?P<type>p|reel|tv)/(?P<code>[A-Za-z0-9_-]+)")


class InstagramDownloadError(RuntimeError):
    """Raised when an Instagram media URL cannot be fetched or parsed."""


@dataclass(slots=True)
class MediaItem:
    """Represents a single downloadable media resource from Instagram."""

    url: str
    is_video: bool
    caption: str | None = None


def extract_instagram_urls(text: str) -> List[str]:
    """Extract Instagram URLs from arbitrary text.

    Only URLs pointing to posts, reels, or TV content are returned.
    """

    urls: List[str] = []
    for candidate in re.findall(r"https?://[^\s]+", text):
        try:
            parsed = urlparse(candidate)
        except ValueError:
            continue
        if parsed.netloc.lower() not in INSTAGRAM_HOSTS:
            continue
        path = parsed.path.strip("/")
        if not path:
            continue
        match = INSTAGRAM_PATH_PATTERN.match(path)
        if match:
            base = f"https://www.instagram.com/{match.group('type')}/{match.group('code')}/"
            urls.append(base)
    return urls


def _build_api_url(media_type: str, shortcode: str) -> str:
    return f"https://www.instagram.com/{media_type}/{shortcode}/?__a=1&__d=dis"


def fetch_instagram_media(url: str) -> List[MediaItem]:
    """Fetch downloadable media URLs for an Instagram post or reel."""

    parsed = urlparse(url)
    if parsed.netloc.lower() not in INSTAGRAM_HOSTS:
        raise InstagramDownloadError("Only instagram.com URLs are supported.")
    path = parsed.path.strip("/")
    match = INSTAGRAM_PATH_PATTERN.match(path)
    if not match:
        raise InstagramDownloadError("The provided link is not a supported Instagram post or reel URL.")

    media_type = match.group("type")
    shortcode = match.group("code")
    api_url = _build_api_url(media_type, shortcode)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "application/json",
    }

    LOGGER.debug("Fetching Instagram metadata for %s", api_url)
    response = requests.get(api_url, headers=headers, timeout=15)
    if response.status_code != 200:
        raise InstagramDownloadError(
            "Instagram did not return a successful response. The post may be private or unavailable."
        )

    try:
        data = response.json()
    except json.JSONDecodeError as exc:
        raise InstagramDownloadError("Unable to parse the Instagram response.") from exc

    media_items = _parse_graphql_payload(data)
    if not media_items:
        media_items = _parse_items_payload(data)

    if not media_items:
        LOGGER.debug("Instagram response payload: %s", data)
        raise InstagramDownloadError("No downloadable media found in this Instagram URL.")

    return media_items


def _parse_graphql_payload(payload: dict) -> List[MediaItem]:
    graphql = payload.get("graphql", {})
    media = graphql.get("shortcode_media")
    if not media:
        return []

    caption = _extract_caption_from_media(media)
    if media.get("edge_sidecar_to_children"):
        nodes = media["edge_sidecar_to_children"].get("edges", [])
        return [
            _node_to_media_item(edge.get("node", {}), caption)
            for edge in nodes
            if edge and edge.get("node")
        ]

    return [_node_to_media_item(media, caption)]


def _parse_items_payload(payload: dict) -> List[MediaItem]:
    items = payload.get("items")
    if not items:
        return []
    results: List[MediaItem] = []
    for item in items:
        caption = _extract_caption_from_media(item)
        media_type = item.get("media_type")
        if media_type == 1:  # Photo
            image_versions = item.get("image_versions2", {}).get("candidates", [])
            if image_versions:
                results.append(MediaItem(url=image_versions[0]["url"], is_video=False, caption=caption))
        elif media_type == 2:  # Video
            video_versions = item.get("video_versions", [])
            if video_versions:
                results.append(MediaItem(url=video_versions[0]["url"], is_video=True, caption=caption))
        elif media_type == 8:  # Carousel
            carousel: Iterable[dict] = item.get("carousel_media", [])
            for carousel_item in carousel:
                results.extend(_parse_items_payload({"items": [carousel_item]}))
    return results


def _node_to_media_item(node: dict, caption: str | None) -> MediaItem:
    if node.get("is_video"):
        video_url = node.get("video_url")
        if not video_url:
            raise InstagramDownloadError("Video URL missing from Instagram response.")
        return MediaItem(url=video_url, is_video=True, caption=caption)
    image_url = node.get("display_url") or node.get("display_resources", [{}])[-1].get("src")
    if not image_url:
        raise InstagramDownloadError("Image URL missing from Instagram response.")
    return MediaItem(url=image_url, is_video=False, caption=caption)


def _extract_caption_from_media(media: dict) -> str | None:
    caption = None
    edge_media_to_caption = media.get("edge_media_to_caption", {})
    if isinstance(edge_media_to_caption, dict):
        edges = edge_media_to_caption.get("edges", [])
        if edges:
            caption = edges[0].get("node", {}).get("text")
    elif media.get("caption"):
        caption = media.get("caption", {}).get("text")
    return caption

