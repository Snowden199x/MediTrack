import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../../shared/api'
import '../css/resident-map.css'

// Fix Leaflet's default marker icon paths broken by bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

interface Resident {
  id: number
  name: string
  age: number | null
  sex: string | null
}

interface Household {
  id: number
  address: string | null
  latitude: number
  longitude: number
  barangay_name: string | null
  city_municipality_name: string | null
  residents: Resident[]
}

interface Props {
  onError: (msg: string) => void
}

export default function ResidentMapPage({ onError }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<L.Map | null>(null)
  const [households, setHouseholds] = useState<Household[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null)

  // Default center: Philippines geographic center
  const DEFAULT_CENTER: L.LatLngTuple = [12.8797, 121.7740]
  const DEFAULT_ZOOM = 6

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data: Household[] = await api('/admin/resident-map')
        if (!cancelled) setHouseholds(data)
      } catch (err: any) {
        if (!cancelled) onError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [])

  // Initialise the map once on mount
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return

    leafletMap.current = L.map(mapRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(leafletMap.current)

    return () => {
      leafletMap.current?.remove()
      leafletMap.current = null
    }
  }, [])

  // Place markers whenever households data arrives
  useEffect(() => {
    if (!leafletMap.current || households.length === 0) return

    const markers: L.Marker[] = []

    households.forEach(household => {
      const label = [
        household.address,
        household.barangay_name,
        household.city_municipality_name,
      ].filter(Boolean).join(', ')

      const residentList = household.residents.length
        ? household.residents.map(r => `<li>${r.name}${r.age ? `, ${r.age} yrs` : ''}${r.sex ? ` · ${r.sex}` : ''}</li>`).join('')
        : '<li>No residents on record</li>'

      const popup = L.popup({ maxWidth: 260 }).setContent(
        `<div class="map-popup">
          <strong>${label || 'Household'}</strong>
          <ul>${residentList}</ul>
        </div>`
      )

      const marker = L.marker([household.latitude, household.longitude])
        .bindPopup(popup)
        .addTo(leafletMap.current!)

      marker.on('click', () => setSelectedHousehold(household))
      markers.push(marker)
    })

    // Fit map to all markers if we have any
    if (markers.length > 0) {
      const group = L.featureGroup(markers)
      leafletMap.current.fitBounds(group.getBounds().pad(0.15))
    }

    return () => {
      markers.forEach(m => m.remove())
    }
  }, [households])

  return (
    <div className="resident-map-page">
      <div className="resident-map-header">
        <h1>Resident map</h1>
        <p>
          {loading
            ? 'Loading household locations…'
            : households.length === 0
              ? 'No households with recorded coordinates yet. Coordinates are set when a BHW registers a household on-site.'
              : `${households.length} household${households.length !== 1 ? 's' : ''} · ${households.reduce((sum, h) => sum + h.residents.length, 0)} residents`}
        </p>
      </div>

      <div className="resident-map-layout">
        <div ref={mapRef} className="resident-map-container" aria-label="Resident location map" />

        {selectedHousehold && (
          <aside className="resident-map-panel">
            <div className="map-panel-header">
              <h2>
                {[selectedHousehold.address, selectedHousehold.barangay_name]
                  .filter(Boolean)
                  .join(', ') || 'Household'}
              </h2>
              <button
                className="map-panel-close"
                aria-label="Close panel"
                onClick={() => setSelectedHousehold(null)}
              >
                ×
              </button>
            </div>
            <p className="map-panel-location">
              {[selectedHousehold.barangay_name, selectedHousehold.city_municipality_name]
                .filter(Boolean)
                .join(', ')}
            </p>
            <h3>Residents ({selectedHousehold.residents.length})</h3>
            {selectedHousehold.residents.length ? (
              <ul className="map-resident-list">
                {selectedHousehold.residents.map(r => (
                  <li key={r.id}>
                    <strong>{r.name}</strong>
                    <span>
                      {[r.age ? `${r.age} yrs` : null, r.sex]
                        .filter(Boolean)
                        .join(' · ') || 'No details recorded'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="map-empty">No residents on record for this household.</p>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
