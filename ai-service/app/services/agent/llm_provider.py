import logging
from typing import Optional
from langchain_core.language_models.chat_models import BaseChatModel
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMProviderFactory:
    @staticmethod
    def get_llm(
        provider_name: Optional[str] = None,
        custom_api_key: Optional[str] = None,
        custom_model: Optional[str] = None,
        custom_base_url: Optional[str] = None,
        temperature: float = 0.5
    ) -> BaseChatModel:
        provider = (provider_name or settings.DEFAULT_LLM_PROVIDER).lower()

        # 1. Google Gemini
        if provider in ("gemini", "google"):
            api_key = custom_api_key or settings.GEMINI_API_KEY
            model_name = custom_model or settings.GEMINI_MODEL
            if api_key and not api_key.startswith("your_"):
                try:
                    from langchain_google_genai import ChatGoogleGenerativeAI
                    return ChatGoogleGenerativeAI(
                        model=model_name,
                        google_api_key=api_key,
                        temperature=temperature,
                        convert_system_message_to_human=True
                    )
                except Exception as e:
                    logger.warning(f"Failed to initialize Gemini: {e}")

        # 2. OpenAI (GPT-4o, GPT-4o-mini, o1, o3-mini)
        if provider == "openai":
            api_key = custom_api_key or getattr(settings, "OPENAI_API_KEY", None)
            model_name = custom_model or settings.OPENAI_MODEL
            if api_key:
                try:
                    from langchain_openai import ChatOpenAI
                    return ChatOpenAI(
                        model=model_name,
                        api_key=api_key,
                        temperature=temperature,
                        presence_penalty=0.2,
                        frequency_penalty=0.4
                    )
                except Exception as e:
                    logger.warning(f"Failed to initialize OpenAI: {e}")

        # 3. Anthropic Claude (Claude 3.5 Sonnet, Claude 3.5 Haiku)
        if provider in ("anthropic", "claude"):
            api_key = custom_api_key or getattr(settings, "ANTHROPIC_API_KEY", None)
            model_name = custom_model or settings.ANTHROPIC_MODEL
            if api_key:
                try:
                    from langchain_anthropic import ChatAnthropic
                    return ChatAnthropic(
                        model=model_name,
                        api_key=api_key,
                        temperature=temperature
                    )
                except Exception as e:
                    logger.warning(f"Failed to initialize Anthropic: {e}")

        # 4. Groq (Llama 3.1 8B, Llama 3.3 70B, DeepSeek R1 Distill)
        if provider == "groq":
            api_key = custom_api_key or settings.GROQ_API_KEY
            model_name = custom_model or settings.GROQ_MODEL
            if api_key and not api_key.startswith("your_"):
                try:
                    from langchain_groq import ChatGroq
                    return ChatGroq(
                        model_name=model_name,
                        groq_api_key=api_key,
                        temperature=temperature,
                        model_kwargs={
                            "frequency_penalty": 0.4,
                            "presence_penalty": 0.2
                        }
                    )
                except Exception as e:
                    logger.warning(f"Failed to initialize Groq: {e}")

        # 5. DeepSeek (DeepSeek V3 / R1 via api.deepseek.com)
        if provider == "deepseek":
            api_key = custom_api_key or getattr(settings, "DEEPSEEK_API_KEY", None)
            model_name = custom_model or settings.DEEPSEEK_MODEL
            base_url = custom_base_url or "https://api.deepseek.com"
            if api_key:
                try:
                    from langchain_openai import ChatOpenAI
                    return ChatOpenAI(
                        model=model_name,
                        api_key=api_key,
                        base_url=base_url,
                        temperature=temperature,
                        presence_penalty=0.2,
                        frequency_penalty=0.4
                    )
                except Exception as e:
                    logger.warning(f"Failed to initialize DeepSeek: {e}")

        # 6. Ollama / Custom Local Endpoint
        if provider in ("ollama", "custom"):
            base_url = custom_base_url or settings.OLLAMA_BASE_URL
            model_name = custom_model or settings.OLLAMA_MODEL
            try:
                from langchain_community.chat_models import ChatOllama
                return ChatOllama(
                    base_url=base_url,
                    model=model_name,
                    temperature=temperature
                )
            except Exception as e:
                logger.warning(f"Failed to initialize Ollama: {e}")

        # 7. Fallback offline synthesizer if no valid API key is present
        from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
        from langchain_core.messages import AIMessage
        logger.info(f"Using local fallback for provider '{provider}'.")
        return GenericFakeChatModel(messages=iter([AIMessage(content=f"👋 Verified AST symbols and repository evidence retrieved.\n\n⚠️ **API Key Required**: Please configure your API key for `{provider.upper()}` in **Model Config** (top right) to enable live model reasoning.")]))

llm_factory = LLMProviderFactory()
