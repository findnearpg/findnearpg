export default function LoadingSpinner({ label = 'Loading', fullScreen = false, dimmed = true }) {
  return (
    <output
      className={`fnpg-loader-wrap ${fullScreen ? 'fnpg-loader-fullscreen' : ''} ${
        dimmed ? 'fnpg-loader-dimmed' : ''
      }`}
      aria-live="polite"
      aria-label={label}
    >
      <div className="fnpg-loader-simple">
        <span className="fnpg-loader-simple-ring" />
        <p className="fnpg-loader-simple-text">{label}</p>
      </div>
    </output>
  );
}
