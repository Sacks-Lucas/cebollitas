import { Construction } from 'lucide-react'

import { es } from '../i18n/es'

export function ComingSoon({ title }: { title: string }) {
  return (
    <section className="flex flex-col items-center justify-center gap-3 rounded-lg bg-argentina-celeste/10 p-10 text-center dark:bg-argentina-navy">
      <Construction size={40} className="text-argentina-celesteDark dark:text-argentina-celeste" />
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-gray-600 dark:text-gray-200">{es.comingSoonMessage}</p>
      <span className="rounded-full bg-argentina-celeste/20 px-3 py-1 text-xs font-medium text-argentina-celesteDark dark:text-argentina-celeste">
        {es.comingSoonTitle}
      </span>
    </section>
  )
}
