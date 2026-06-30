import HelpButton from './HelpButton';
import { HELP_CONTENT } from './helpContent';

/**
 * Title row shown at the top of a tab's content, with a "?" help button beside
 * it. Renders nothing (so the layout is untouched) if there is no help topic
 * registered for the tab.
 */
export default function TabHeader({ topic, title }) {
  if (!HELP_CONTENT[topic]) return null;
  return (
    <div className="dnd-tab-header">
      <h2 className="dnd-tab-header__title">{title}</h2>
      <HelpButton topic={topic} label={`About the ${title} tab`} />
    </div>
  );
}
