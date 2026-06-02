import { getModeConfig } from '../data/modes';

export default function ModeTooltip({ mode }) {
  const config = getModeConfig(mode);

  return (
    <span className="mode-tooltip">
      <span className="mode-tooltip-trigger" tabIndex={0} aria-label={`Info mode ${config.shortLabel}`}>
        ?
      </span>
      <span className="mode-tooltip-popup" role="tooltip">
        {config.tooltip}
        <br /><br />
        {config.audience}
      </span>
    </span>
  );
}
