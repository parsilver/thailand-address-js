import * as React from "react"
import { Link, Route, Switch } from "wouter"

import { LocaleProvider, useT } from "@/lib/locale"
import { Layout } from "@/site/layout"
import { OverviewPage } from "@/pages/overview"
import { Page } from "@/pages/page"

// The overview loads with the app; every other page loads when visited.
const lazy = <M extends Record<string, React.ComponentType>>(
  load: () => Promise<M>,
  name: keyof M
) =>
  React.lazy(() =>
    load().then((m) => ({ default: m[name] as React.ComponentType }))
  )
const docs = () => import("@/pages/docs")
const examples = () => import("@/pages/examples")
const reference = () => import("@/pages/reference")
const InstallationPage = lazy(docs, "InstallationPage")
const DatasetPage = lazy(docs, "DatasetPage")
const PostalFirstPage = lazy(examples, "PostalFirstPage")
const AreaFirstPage = lazy(examples, "AreaFirstPage")
const SearchPage = lazy(examples, "SearchPage")
const MultiplePage = lazy(examples, "MultiplePage")
const FacilityUnknownPage = lazy(examples, "FacilityUnknownPage")
const ReactHookFormPage = lazy(examples, "ReactHookFormPage")
const AddressFormReferencePage = lazy(reference, "AddressFormReferencePage")
const CoreReferencePage = lazy(reference, "CoreReferencePage")
const LaravelPage = lazy(reference, "LaravelPage")

function NotFound() {
  const t = useT()
  return (
    <Page title={String(t("ไม่พบหน้านี้", "Page not found"))}>
      <Link href="/" className="underline underline-offset-4">
        {t("กลับไปหน้าภาพรวม", "Back to the overview")}
      </Link>
    </Page>
  )
}

export function App() {
  return (
    <LocaleProvider>
      <Layout>
        <React.Suspense
          fallback={<div aria-busy="true" className="min-h-96" />}
        >
          <Switch>
            <Route path="/" component={OverviewPage} />
            <Route path="/docs/installation" component={InstallationPage} />
            <Route path="/docs/dataset" component={DatasetPage} />
            <Route path="/examples/postal-first" component={PostalFirstPage} />
            <Route path="/examples/area-first" component={AreaFirstPage} />
            <Route path="/examples/search" component={SearchPage} />
            <Route path="/examples/multiple" component={MultiplePage} />
            <Route
              path="/examples/facility-unknown"
              component={FacilityUnknownPage}
            />
            <Route
              path="/examples/react-hook-form"
              component={ReactHookFormPage}
            />
            <Route
              path="/reference/address-form"
              component={AddressFormReferencePage}
            />
            <Route path="/reference/core" component={CoreReferencePage} />
            <Route path="/reference/laravel" component={LaravelPage} />
            <Route component={NotFound} />
          </Switch>
        </React.Suspense>
      </Layout>
    </LocaleProvider>
  )
}

export default App
