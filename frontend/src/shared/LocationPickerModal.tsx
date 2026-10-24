import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './LocationPickerModal.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Fix bundler-broken default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

interface LatLng {
  lat: number
  lng: number
}

interface Props {
  initial?: LatLng | null
  onConfirm: (coords: LatLng) => void
  onClose: () => void
}

// Philippines geographic center — good default view
const PH_CENTER: L.LatLngTuple = [12.8797, 121.774]
const PH_ZOOM = 6

export default function LocationPickerModal({ initial, onConfirm, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [picked, setPicked] = useState<LatLng | null>(initial ?? null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState('')

  // Init map once
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return

    const map = L.map(mapRef.current).setView(
      initial ? [initial.lat, initial.lng] : PH_CENTER,
      initial ? 16 : PH_ZOOM
    )

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // Place initial marker if we have coords
    if (initial) {
      markerRef.current = L.marker([initial.lat, initial.lng], { draggable: true }).addTo(map)
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng()
        setPicked({ lat: pos.lat, lng: pos.lng })
      })
    }

    // Click on map to place / move marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      setPicked({ lat, lng })

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng()
          setPicked({ lat: pos.lat, lng: pos.lng })
        })
      }
    })

    leafletMap.current = map

    return () => {
      map.remove()
      leafletMap.current = null
      markerRef.current = null
    }
  }, [])

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    setLocateError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const { latitude: lat, longitude: lng } = pos.coords
        const map = leafletMap.current!

        map.setView([lat, lng], 17)
        setPicked({ lat, lng })

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
          markerRef.current.on('dragend', () => {
            const p = markerRef.current!.getLatLng()
            setPicked({ lat: p.lat, lng: p.lng })
          })
        }
      },
      () => {
        setLocating(false)
        setLocateError('Could not get your location. Try clicking the map manually.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  function confirm() {
    if (picked) onConfirm(picked)
  }

  return (
    <div className="lpm-overlay" role="dialog" aria-modal="true" aria-label="Pick home location">
      <div className="lpm-modal">
        <div className="lpm-header">
          <div>
            <h2>Set your home location</h2>
            <p>Click anywhere on the map to drop a pin. You can also drag the pin to adjust it.</p>
          </div>
          <button className="lpm-close" aria-label="Close map" onClick={onClose}>×</button>
        </div>

        <div className="lpm-toolbar">
          <button
            type="button"
            className="button secondary small"
            onClick={useMyLocation}
            disabled={locating}
          >
            {locating ? 'Getting location…' : 'Jump to my GPS location'}
          </button>
          {locateError && <span className="lpm-error">{locateError}</span>}
          {picked && (
            <span className="lpm-coords">
              {picked.lat.toFixed(6)}, {picked.lng.toFixed(6)}
            </span>
          )}
        </div>

        <div ref={mapRef} className="lpm-map" />

        <div className="lpm-footer">
          <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="button"
            disabled={!picked}
            onClick={confirm}
          >
            Confirm location
          </button>
        </div>
      </div>
    </div>
  )
}
