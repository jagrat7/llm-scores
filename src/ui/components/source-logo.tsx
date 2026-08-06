import type { ProviderName } from "#/ui/lib/orpc-client"

import { cn } from "#/ui/lib/utils"

type SourceMark = { viewBox: string; paths: ReadonlyArray<string> }

/**
 * Data-source marks, flattened to `currentColor` like the model marks so a source never
 * competes with the chart's own colour encoding.
 * Sources: artificialanalysis.ai, datacurve.ai (DeepSWE). Trademarks of their owners.
 */
const SOURCE_MARKS: Record<ProviderName, SourceMark> = {
  artificialAnalysis: {
    viewBox: "0 0 53 53",
    paths: [
      "M46.2194 52.8201H52.8194V39.6101H46.2194H39.6094V52.8201H46.2194Z",
      "M26.41 0L13.2 13.2H0V26.41H19.81L33.01 13.2H39.61V0H26.41Z",
      "M26.41 26.4099L13.2 39.6099H0V52.8199H19.81L33.01 39.6099H39.61V26.4099H26.41Z",
      "M52.8194 26.41V13.2H46.2194H39.6094V26.41H46.2194H52.8194Z",
    ],
  },
  deepswe: {
    viewBox: "0 0 51 51",
    paths: [
      "M44.359 50.3612H15.1535C14.6037 50.3612 14.063 50.222 13.5815 49.9566C10.9198 48.4894 11.5362 44.4142 14.4133 43.4346C22.7273 40.604 26.0971 36.4192 28.0568 28.1627C31.274 17.99 35.5491 13.1346 43.5398 10.6088C47.0462 9.50039 50.3618 12.4055 50.3618 16.0829V44.3584C50.3618 47.6737 47.6743 50.3612 44.359 50.3612Z",
      "M6.0012 0H35.2067C35.7565 0 36.2973 0.13918 36.7787 0.404568C39.4404 1.87183 38.824 5.94707 35.9469 6.92662C27.6329 9.75718 24.2632 13.9421 22.3034 22.1985C19.0862 32.3712 14.8111 37.2266 6.82042 39.7525C3.31397 40.8608 -0.00158691 37.9557 -0.00158691 34.2782V6.00279C-0.00158691 2.68753 2.68595 0 6.0012 0Z",
    ],
  },
}

export function SourceLogo({
  source,
  className,
}: {
  source: ProviderName
  className?: string
}) {
  const mark = SOURCE_MARKS[source]

  return (
    <svg
      aria-hidden="true"
      viewBox={mark.viewBox}
      fill="currentColor"
      className={cn("size-3.5 shrink-0", className)}
    >
      {mark.paths.map((path) => (
        <path key={path.slice(0, 24)} d={path} />
      ))}
    </svg>
  )
}
