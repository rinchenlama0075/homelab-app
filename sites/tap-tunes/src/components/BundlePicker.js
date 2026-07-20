export default function BundlePicker({ bundles, onPick, busy }) {
  return (
    <div className="bundle-grid">
      {bundles.map((bundle) => (
        <button
          key={bundle.tokens}
          className="bundle-option"
          disabled={busy}
          onClick={() => onPick(bundle.tokens)}
        >
          <strong>${(bundle.amountCents / 100).toFixed(2)}</strong>
          <span>{bundle.label}</span>
        </button>
      ))}
    </div>
  );
}
