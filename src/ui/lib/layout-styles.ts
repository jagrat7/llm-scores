export const CHART_HEIGHT_CLASS = "h-[70vh] min-h-[32rem] max-h-[52rem]"
export const CONTENT_WIDTH_CLASS = "w-full max-w-[96rem]"
export const TABLE_WIDTH_CLASS = "w-full min-w-[52rem]"

/**
 * The app header is sticky, so anything else that sticks has to start below it.
 * The pair moves together — changing one without the other hides table headings
 * behind the nav.
 */
export const HEADER_HEIGHT_CLASS = "h-12"
/** Inert until the element it sits on actually sticks. */
export const BELOW_HEADER_OFFSET_CLASS = "top-12"
