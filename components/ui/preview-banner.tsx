/**
 * Honest "this is not real yet" banner. Shown on every screen that renders
 * placeholder data, so nothing in the skeleton is mistaken for live data.
 */
export function PreviewBanner({ note }: { note?: string }) {
  return (
    <div className="mb-6 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
      <span className="font-semibold">Preview</span>
      <span className="text-warning/90">
        {note ?? 'Sample data — this screen is a UI mockup and will be wired to your real account data.'}
      </span>
    </div>
  );
}
