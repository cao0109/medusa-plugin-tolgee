import { DetailWidgetProps } from "@medusajs/framework/types"
import { useQuery } from "@tanstack/react-query"
import { Tolgee, TolgeeProvider, FormatSimple, TolgeeInstance } from "@tolgee/react";
import { InContextTools } from "@tolgee/web/tools";

import TranslationManagement from "./TranslationManagement";
import { sdk } from "../lib/sdk";
import { useEffect, useState } from "react";
import { TolgeeAdminOptions, SupportedModels, WidgetType } from "../../common";
import PluginI18n from "./PluginI18n";

export const TranslationWidget = <T extends SupportedModels>(slug: T) =>
  ({ data: { id } }: DetailWidgetProps<WidgetType<T>>) => {
    const [tolgee, setTolgee] = useState<TolgeeInstance | null>(null);

    const { data } = useQuery<TolgeeAdminOptions>({
      queryFn: () => sdk.client.fetch("/admin/tolgee/options"),
      queryKey: ["tolgee-options"],
    })

    useEffect(() => {
      if (data && !tolgee) {
        const languages = data.availableLanguages.map((lang) => lang.tag);

        const tolgeeInstance = Tolgee()
          .use(FormatSimple())
          .init({
            language: data.defaultLanguage,
            apiUrl: data.apiUrl,
            apiKey: data.apiKey,
            availableLanguages: languages,
            observerOptions: {
              highlightColor: "rgba(0,0,0,0.7)",
            },
          });

        tolgeeInstance.addPlugin(InContextTools());
        setTolgee(tolgeeInstance);
      }
    }, [data]);

    return (
      <>
        <PluginI18n>
          {tolgee ? (
            <TolgeeProvider tolgee={tolgee} fallback="Loading...">
              <TranslationManagement
                id={id}
                slug={slug}
                availableLanguages={data?.availableLanguages || []}
                defaultLanguage={data?.defaultLanguage || "en"}
              />
            </TolgeeProvider>
          ) : (
            <div>Loading...</div>
          )}
        </PluginI18n>
      </>
    );
  };



export default TranslationWidget
