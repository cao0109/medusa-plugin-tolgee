import { MedusaError } from "@medusajs/utils";
import axios, { AxiosResponseTransformer } from "axios";
import { AxiosCacheInstance } from "axios-cache-interceptor";
import {
  defaultSupportedProperties,
  ModelDTO,
  SupportedModels,
  TolgeeAdminOptions,
} from "../../common";

export type TolgeeModuleConfig = {
  projectId: string;
  apiKey: string;
  baseURL: string;
  ttl?: number;
  rateLimit?: {
    maxRequests?: number;
    perMilliseconds?: number;
  };
  keys?: {
    [key in SupportedModels]?: string[];
  };
  tags?: {
    [key in SupportedModels]?: string[];
  };
};

type TolgeeModuleConfigInternal = Omit<TolgeeModuleConfig, "keys"> & {
  keys: Required<TolgeeModuleConfig["keys"]>;
};

type TolgeeLanguagesResponse = {
  _embedded: {
    languages: {
      name: string;
      tag: string;
      base: boolean;
    }[];
  };
};

class TolgeeModuleService {
  protected client_: AxiosCacheInstance;
  readonly options_: TolgeeModuleConfigInternal;

  constructor(
    { tolgeeClient }: { tolgeeClient: AxiosCacheInstance },
    options: TolgeeModuleConfig
  ) {
    this.client_ = tolgeeClient;

    this.options_ = {
      ...options,
      keys: {
        ...defaultSupportedProperties,
        ...options.keys,
      },
    };
  }

  async getOptions(): Promise<TolgeeAdminOptions> {
    try {
      const { data: languages } = await this.client_.get<
        Pick<TolgeeAdminOptions, "defaultLanguage" | "availableLanguages">
      >(`/languages`, {
        // use transformResponse to also cache computation.
        // concat to the existing transforms gives JSON deserial. automatically
        transformResponse: (
          axios.defaults.transformResponse as AxiosResponseTransformer[]
        ).concat((data: TolgeeLanguagesResponse) => {
          const languages = data?._embedded?.languages;
          if (!languages || languages.length < 1)
            return {
              defaultLanguage: "en",
              availableLanguages: [],
            };

          const defaultLanguage =
            languages.find((lang) => lang.base)?.tag ?? languages[0].tag;
          const availableLanguages = languages.map((lang) => ({
            label: lang.name,
            tag: lang.tag,
          }));
          return { defaultLanguage, availableLanguages };
        }),
      });

      return {
        ...languages,
        apiKey: this.options_.apiKey,
        apiUrl: this.options_.baseURL,
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to fetch languages for project: ${error.message}`
      );
    }
  }

  async getNamespaceKeys(id: string | string[]): Promise<string[]> {
    const ids = Array.isArray(id) ? id : [id];
    try {
      const response = await this.client_.get(
        `/keys/select?filterNamespace=${ids.join(",")}`
      );

      return response.data.ids;
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to fetch namespace keys for ${id}: ${error.message}`
      );
    }
  }

  async getKeyName(keyId: string): Promise<string> {
    try {
      const response = await this.client_.get(`/keys/${keyId}`);

      return response.data.name;
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to fetch key name for key ID ${keyId}: ${error.message}`
      );
    }
  }

  async getProductTranslationKeys(ids: string | string[]) {
    const keys = await this.getNamespaceKeys(ids);
    return await Promise.all(keys.map((keyId) => this.getKeyName(keyId)));
  }

  async list(filter: {
    id: string | string[];
    context?: { country_code: string };
  }) {
    try {
      const country_code = filter.context?.country_code?.toLowerCase();

      const ids = Array.isArray(filter.id) ? filter.id : [filter.id];

      const langs = (await this.getOptions()).availableLanguages
        .map((lang) => lang.tag)
        .join(",");

      const response = await Promise.all(
        ids.map(async (id) => {
          const { data } = await this.client_.get(
            `/translations/${langs}?ns=${id}`
          );

          for (const key in data) {
            // 如果数据不存在，跳过
            if (!data[key]) continue;

            // 如果是嵌套结构（包含 id）
            if (data[key][id]) {
              data[key] = data[key][id];
            }
            // 如果不是嵌套结构，说明是扁平结构，保持原样
          }
          return { id, ...(country_code ? data[country_code] : data) };
        })
      );

      return response;
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to fetch translations for key ID ${filter.id}: ${error.message}`
      );
    }
  }

  async createNewKeyWithTranslation(
    keys: {
      id: string;
      tags: string[];
      keyName: string;
      translation: string;
    }[]
  ): Promise<any> {
    try {
      const tolgeeOptions = await this.getOptions();
      await this.client_.post(`/keys/import`, {
        keys: keys.map(({ id, tags, keyName, translation }) => ({
          name: `${id}.${keyName}`,
          tags,
          namespace: id,
          translations: { [tolgeeOptions.defaultLanguage]: translation },
        })),
      });

      return;
    } catch (error) {
      console.error(error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to import keys ${error}`
      );
    }
  }

  async createModelTranslations(
    models: ModelDTO[],
    type: SupportedModels
  ): Promise<string[]> {
    const keys = models.flatMap(
      (model) =>
        this.options_.keys?.[type]?.map((key) => ({
          id: model.id,
          tags: this.options_.tags?.[type] ?? [type],
          keyName: key,
          translation: model?.[key] ?? "",
        })) ?? []
    );

    try {
      await this.createNewKeyWithTranslation(keys);
      return models.map((model) => model.id);
    } catch (error) {
      console.error(
        `Entities of type ${type} already translated or error creating translations: ${models.map(
          (model) => model.id
        )}`,
        error
      );
      return [];
    }
  }

  async deleteTranslation(id: string): Promise<void> {
    const keys = await this.getNamespaceKeys(id);

    try {
      const response = await this.client_.delete(`/keys/${keys}`);

      return response.data;
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to delete translations for namespace ${id}: ${error.message}`
      );
    }
  }
}

export default TolgeeModuleService;
