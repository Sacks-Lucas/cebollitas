import { FileText, Mail } from 'lucide-react'

function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.05.78 2.11 0 1.53-.01 2.76-.01 3.13 0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

type FooterProps = {
  companyName: string
  rightsText: string
  year?: number
  version?: string
  contactEmail?: string
  contactLabel?: string
  githubUrl?: string
  githubLabel?: string
  contractUrl?: string
  contractLabel?: string
}

export function Footer({
  companyName,
  rightsText,
  year = new Date().getFullYear(),
  version,
  contactEmail,
  contactLabel,
  githubUrl,
  githubLabel,
  contractUrl,
  contractLabel,
}: FooterProps) {
  return (
    <footer className="border-t border-argentina-celeste/30 bg-argentina-celeste/10 px-4 py-4 text-xs text-argentina-navy dark:bg-argentina-navy dark:text-gray-200">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-center sm:text-left">
          <span>© {year} {companyName} · {rightsText}</span>
          {version ? <span className="ml-2 opacity-70">v{version}</span> : null}
        </p>
        {(contactEmail || githubUrl || contractUrl) && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {contactEmail ? (
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-1 hover:underline focus:outline-none focus:underline"
              >
                <Mail size={14} aria-hidden="true" />
                <span>{contactLabel ?? contactEmail}</span>
              </a>
            ) : null}
            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline focus:outline-none focus:underline"
              >
                <GithubIcon size={14} />
                <span>{githubLabel ?? 'GitHub'}</span>
              </a>
            ) : null}
            {contractUrl ? (
              <a
                href={contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline focus:outline-none focus:underline"
              >
                <FileText size={14} aria-hidden="true" />
                <span>{contractLabel ?? 'Contract'}</span>
              </a>
            ) : null}
          </div>
        )}
      </div>
    </footer>
  )
}
