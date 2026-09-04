export default function Skeleton({
  width,
  height,
  className = '',
  rounded = 'rounded-md',
}) {
  return (
    <div
      className={`skeleton-shimmer ${rounded} ${className}`}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
      }}
    />
  )
}
