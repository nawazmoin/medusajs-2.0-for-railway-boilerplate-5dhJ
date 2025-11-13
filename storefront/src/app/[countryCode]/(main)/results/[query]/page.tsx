import { Metadata } from "next"
import { notFound } from "next/navigation"
import { search } from "@modules/search/actions"
import SearchResultsTemplate from "@modules/search/templates/search-results-template"
import { isSearchEnabled } from "@lib/search-client"

type Props = {
  params: { query: string; countryCode: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { query } = params

  return {
    title: `Search Results for: ${query}`,
    description: `Search results for: ${query}`,
  }
}

export default async function SearchResultsPage({ params }: Props) {
  const { query } = params

  // If search is not enabled, show a message or redirect
  if (!isSearchEnabled) {
    return (
      <div className="content-container py-6">
        <h1 className="text-2xl font-bold mb-4">Search Not Available</h1>
        <p>Search functionality is currently disabled. Please browse our products instead.</p>
      </div>
    )
  }

  const hits = await search(query)

  if (!hits) {
    notFound()
  }

  return (
    <SearchResultsTemplate query={query} hits={hits} countryCode={params.countryCode} />
  )
}