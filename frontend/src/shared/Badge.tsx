// Small status pill. The value is also used as a CSS modifier (badge-<value>).
export default function Badge({ value }: { value: string }) {
  const key = String(value ?? '').replaceAll('_', '-')
  return <span className={`badge badge-${key}`}>{String(value ?? '').replaceAll('_', ' ')}</span>
}
