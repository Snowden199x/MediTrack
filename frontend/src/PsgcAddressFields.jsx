import { useEffect, useState } from 'react'
import { api } from './api'

export default function PsgcAddressFields({ value, onChange, heading = 'Address' }) {
  const [regions, setRegions] = useState([])
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [barangays, setBarangays] = useState([])
  const [provinceRequired, setProvinceRequired] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadRegions() {
      try {
        const result = await api('/locations/regions')
        if (isMounted) setRegions(result)
      } catch (failure) {
        if (isMounted) setError(failure.message)
      }
    }

    void loadRegions()

    return () => { isMounted = false }
  }, [])

  async function selectRegion(code) {
    const region = regions.find(item => item.code === code)
    setProvinces([])
    setCities([])
    setBarangays([])
    setProvinceRequired(true)
    setError('')
    onChange({
      region_code: region?.code || '',
      region_name: region?.name || '',
      province_code: '',
      province_name: '',
      city_municipality_code: '',
      city_municipality_name: '',
      barangay_code: '',
      barangay_name: '',
    })
    if (!region) return

    setLoading(true)
    try {
      const provinceOptions = await api(`/locations/regions/${encodeURIComponent(region.code)}/provinces`)
      setProvinces(provinceOptions)
      setProvinceRequired(provinceOptions.length > 0)
      if (provinceOptions.length === 0) {
        const cityOptions = await api(`/locations/regions/${encodeURIComponent(region.code)}/cities-municipalities`)
        setCities(cityOptions)
      }
    } catch (failure) {
      setError(failure.message)
    } finally {
      setLoading(false)
    }
  }

  async function selectProvince(code) {
    const province = provinces.find(item => item.code === code)
    setCities([])
    setBarangays([])
    setError('')
    onChange({
      province_code: province?.code || '',
      province_name: province?.name || '',
      city_municipality_code: '',
      city_municipality_name: '',
      barangay_code: '',
      barangay_name: '',
    })
    if (!province) return

    setLoading(true)
    try {
      setCities(await api(`/locations/provinces/${encodeURIComponent(province.code)}/cities-municipalities`))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setLoading(false)
    }
  }

  async function selectCity(code) {
    const city = cities.find(item => item.code === code)
    setBarangays([])
    setError('')
    onChange({
      city_municipality_code: city?.code || '',
      city_municipality_name: city?.name || '',
      barangay_code: '',
      barangay_name: '',
    })
    if (!city) return

    setLoading(true)
    try {
      setBarangays(await api(`/locations/cities-municipalities/${encodeURIComponent(city.code)}/barangays`))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setLoading(false)
    }
  }

  function selectBarangay(code) {
    const barangay = barangays.find(item => item.code === code)
    onChange({ barangay_code: barangay?.code || '', barangay_name: barangay?.name || '' })
  }

  return <div className="form-stack">
    <h3>{heading}</h3>
    <div className="form-row">
      <label>Region<select required value={value.region_code || ''} onChange={event => selectRegion(event.target.value)}><option value="">Select region</option>{regions.map(region => <option key={region.code} value={region.code}>{region.name}</option>)}</select></label>
      {provinceRequired && <label>Province<select required disabled={!value.region_code || loading || provinces.length === 0} value={value.province_code || ''} onChange={event => selectProvince(event.target.value)}><option value="">Select province</option>{provinces.map(province => <option key={province.code} value={province.code}>{province.name}</option>)}</select></label>}
    </div>
    <div className="form-row">
      <label>City / municipality<select required disabled={!value.region_code || (provinceRequired && !value.province_code) || loading} value={value.city_municipality_code || ''} onChange={event => selectCity(event.target.value)}><option value="">Select city or municipality</option>{cities.map(city => <option key={city.code} value={city.code}>{city.name}</option>)}</select></label>
      <label>Barangay<select required disabled={!value.city_municipality_code || loading} value={value.barangay_code || ''} onChange={event => selectBarangay(event.target.value)}><option value="">Select barangay</option>{barangays.map(barangay => <option key={barangay.code} value={barangay.code}>{barangay.name}</option>)}</select></label>
    </div>
    {loading && <p role="status">Loading address options…</p>}
    {error && <p className="notice error" role="alert">{error}</p>}
  </div>
}
