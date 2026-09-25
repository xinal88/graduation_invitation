#!/usr/bin/env bash
# Tải lại dữ liệu OpenStreetMap khu Bách khoa (≈750 KB) rồi sinh lại js/campus-*.js
set -e
cd "$(dirname "$0")"
Q='[out:json][timeout:60];(way["building"](21.0015,105.8395,21.0085,105.8490);way["amenity"="parking"](21.0015,105.8395,21.0085,105.8490);way["highway"](21.0015,105.8395,21.0085,105.8490););out geom tags;'
curl -s --max-time 90 https://maps.mail.ru/osm/tools/overpass/api/interpreter --data-urlencode "data=$Q" -o osm.json
python3 build_campus.py
python3 routes.py
