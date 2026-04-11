import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CASES, getCaseBySlug } from '@/data/cases'
import CaseStudyPage from '@/components/case-study/CaseStudyPage'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return CASES.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cs = getCaseBySlug(slug)
  if (!cs) return {}
  return { title: `${cs.title} — Lab` }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const cs = getCaseBySlug(slug)
  if (!cs) notFound()
  return <CaseStudyPage cs={cs} />
}
