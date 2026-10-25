import BooksBlue from "./BooksBlue";
import OpenBook from "./OpenBook";
import RevisionPlan from "./RevisionPlan";
import TargetIllustration from "./TargetIllustration";
import LaptopPlay from "./LaptopPlay";
import ChecklistClock from "./ChecklistClock";
import NotebookRed from "./NotebookRed";
import BooksSubjects from "./BooksSubjects";
import BooksLight from "./BooksLight";

export {
  BooksBlue,
  OpenBook,
  RevisionPlan,
  TargetIllustration,
  LaptopPlay,
  ChecklistClock,
  NotebookRed,
  BooksSubjects,
  BooksLight,
};

export const COURSE_ILLUSTRATIONS = {
  "books-blue": BooksBlue,
  "open-book": OpenBook,
  "revision-plan": RevisionPlan,
  target: TargetIllustration,
  "laptop-play": LaptopPlay,
  "checklist-clock": ChecklistClock,
  "notebook-red": NotebookRed,
  "books-subjects": BooksSubjects,
  "books-light": BooksLight,
};

export default function CourseIllustration({
  name = "books-blue",
  className = "w-full h-full",
  ...props
}) {
  const Component = COURSE_ILLUSTRATIONS[name] || BooksBlue;
  return <Component className={className} {...props} />;
}
