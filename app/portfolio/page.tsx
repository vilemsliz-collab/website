import type { Metadata } from 'next'
import Carousel from '@/components/carousel/Carousel'
import './portfolio.css'

export const metadata: Metadata = {
  title: 'Portfolio — Lab',
}

export default function PortfolioPage() {
  return <Carousel />
}
