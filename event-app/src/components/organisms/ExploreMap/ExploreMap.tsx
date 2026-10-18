
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";

import "leaflet/dist/leaflet.css";

import type { Event } from "@/types/event";

interface ExploreMapProps {
  events: Event[];
}

interface CityMarker {
  name: string;
  latitude: number;
  longitude: number;
  count: number;
}

export function ExploreMap({
  events,
}: ExploreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  const [error, setError] = useState(false);

  const cities = useMemo(() => {
    const grouped = new Map<string, CityMarker>();

    for (const event of events) {
      const latitude = event.cityLatitude;
      const longitude = event.cityLongitude;

      if (
        latitude === undefined ||
        longitude === undefined ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180
      ) {
        continue;
      }

      const key = `${latitude},${longitude}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        grouped.set(key, {
          name: event.city,
          latitude,
          longitude,
          count: 1,
        });
      }
    }

    return Array.from(grouped.values());
  }, [events]);

  useEffect(() => {
    if (!containerRef.current || cities.length === 0) {
      return;
    }

    let cancelled = false;
    let map: LeafletMap | null = null;

    async function initializeMap() {
      try {
        const L = await import("leaflet");

        if (cancelled || !containerRef.current) {
          return;
        }

        const firstCity = cities[0];

        map = L.map(containerRef.current, {
          center: [
            firstCity.latitude,
            firstCity.longitude,
          ],
          zoom: 11,
          zoomControl: true,
          scrollWheelZoom: false,
        });

        mapRef.current = map;

        L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }
        ).addTo(map);

        const bounds = L.latLngBounds([]);

        for (const city of cities) {
          const position: [number, number] = [
            city.latitude,
            city.longitude,
          ];

          const markerIcon = L.divIcon({
            className: "eventgo-city-marker",
            html: `
              <div style="
                display:flex;
                align-items:center;
                justify-content:center;
                width:42px;
                height:42px;
                border:3px solid white;
                border-radius:50%;
                background:#FF6B53;
                color:white;
                font-size:14px;
                font-weight:700;
                box-shadow:0 4px 15px rgba(0,0,0,.2);
              ">${city.count}</div>
            `,
            iconSize: [42, 42],
            iconAnchor: [21, 21],
          });

          const marker = L.marker(position, {
            icon: markerIcon,
            title: city.name,
          }).addTo(map);

          const popup = document.createElement("div");

          const title = document.createElement("strong");
          title.textContent = city.name;

          const description = document.createElement("p");
          description.textContent =
            `${city.count} events on this page`;

          popup.append(title, description);

          marker.bindPopup(popup);
          bounds.extend(position);
        }

        if (cities.length === 1) {
          map.setView(
            [firstCity.latitude, firstCity.longitude],
            11
          );
        } else {
          map.fitBounds(bounds, {
            padding: [45, 45],
            maxZoom: 12,
          });
        }

        requestAnimationFrame(() => {
          map?.invalidateSize();
        });
      } catch (error) {
        console.error("Map initialization failed:", error);

        if (!cancelled) {
          setError(true);
        }
      }
    }

    initializeMap();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, [cities]);

  if (cities.length === 0) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center bg-[#E8EFEC] p-8 text-center">
        <p className="max-w-xs text-sm leading-6 text-slate-600">
          No city coordinates are available for
          the events on this page.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[420px] w-full">
      {error && (
        <div
          role="alert"
          className="absolute inset-0 z-[500] flex items-center justify-center bg-[#E8EFEC] p-8 text-center text-sm text-slate-700"
        >
          Unable to load the map.
        </div>
      )}

      <div
        ref={containerRef}
        className="h-full min-h-[420px] w-full"
        aria-label="Map of cities with events"
      />

      <div className="pointer-events-none absolute left-4 top-4 z-[400] rounded-xl bg-white/95 px-4 py-3 shadow-md">
        <p className="text-xs font-bold text-[#08111D]">
          Event cities
        </p>

        <p className="mt-1 text-[11px] text-slate-500">
          {cities.length} cities on this page
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-4 right-4 z-[400] mx-auto max-w-xs rounded-xl bg-white/95 px-4 py-3 text-center shadow-md">
        <p className="text-[11px] leading-5 text-slate-600">
          Markers represent city centers, not exact
          event venues.
        </p>
      </div>
    </div>
  );
}
