import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';

export default class OpenAILikeProvider extends BaseProvider {
  name = 'OpenAILike';
  getApiKeyLink = undefined;

  config = {
    baseUrlKey: 'OPENAI_LIKE_API_BASE_URL',
    apiTokenKey: 'OPENAI_LIKE_API_KEY',
  };

  // Kaggle tunnel offline hone pe bhi model list dikhe — static fallback
  staticModels: ModelInfo[] = [
    {
      name: 'qwen3.6-35b-aggressive',
      label: 'Qwen3.6-35B Aggressive (Kaggle GPU)',
      provider: 'OpenAILike',
      maxTokenAllowed: 8192,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    try {
      const baseUrl =
        serverEnv?.OPENAI_LIKE_API_BASE_URL ||
        settings?.baseUrl ||
        apiKeys?.OPENAI_LIKE_API_BASE_URL ||
        '';

      const apiKey =
        serverEnv?.OPENAI_LIKE_API_KEY ||
        apiKeys?.OpenAILike ||
        apiKeys?.OPENAI_LIKE_API_KEY ||
        'sk-no-key';

      if (!baseUrl) {
        console.warn('OpenAILike: No baseUrl — returning static models');
        return this.staticModels;
      }

      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`OpenAILike: /models ${response.status} — using static`);
        return this.staticModels;
      }

      const data = (await response.json()) as { data: Array<{ id: string }> };

      const dynamicModels = data.data.map((model) => ({
        name: model.id,
        label: model.id,
        provider: 'OpenAILike',
        maxTokenAllowed: 8192,
      }));

      return dynamicModels.length > 0 ? dynamicModels : this.staticModels;
    } catch (error) {
      console.warn('OpenAILike: getDynamicModels error — using static:', error);
      return this.staticModels;
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;
    const envRecord = this.convertEnvToRecord(serverEnv);

    const baseUrl =
      envRecord.OPENAI_LIKE_API_BASE_URL ||
      providerSettings?.OpenAILike?.baseUrl ||
      apiKeys?.OPENAI_LIKE_API_BASE_URL ||
      '';

    const apiKey =
      envRecord.OPENAI_LIKE_API_KEY ||
      apiKeys?.OpenAILike ||
      'sk-no-key';

    if (!baseUrl) {
      throw new Error('OpenAILike: OPENAI_LIKE_API_BASE_URL missing!');
    }

    return getOpenAILikeModel(baseUrl, apiKey, model);
  }
}
