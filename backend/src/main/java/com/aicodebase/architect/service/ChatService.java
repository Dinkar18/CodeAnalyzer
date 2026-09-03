package com.aicodebase.architect.service;

import com.aicodebase.architect.constant.AppConstants;
import com.aicodebase.architect.dto.ChatRequestDto;
import com.aicodebase.architect.dto.ChatResponseDto;
import com.aicodebase.architect.dto.ConversationDto;
import com.aicodebase.architect.dto.MessageDto;
import com.aicodebase.architect.exception.ResourceNotFoundException;
import com.aicodebase.architect.model.entity.ConversationEntity;
import com.aicodebase.architect.model.entity.MessageEntity;
import com.aicodebase.architect.model.entity.RepositoryEntity;
import com.aicodebase.architect.model.entity.UserEntity;
import com.aicodebase.architect.repository.ConversationJpaRepository;
import com.aicodebase.architect.repository.MessageJpaRepository;
import com.aicodebase.architect.repository.RepositoryJpaRepository;
import com.aicodebase.architect.security.CurrentUserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final RepositoryJpaRepository repositoryJpaRepository;
    private final ConversationJpaRepository conversationJpaRepository;
    private final MessageJpaRepository messageJpaRepository;
    private final AiServiceClient aiServiceClient;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<ConversationDto> getConversations(UUID repositoryId) {
        Optional<UserEntity> userOpt = currentUserService.getCurrentUser();
        if (userOpt.isEmpty()) {
            return List.of();
        }
        return conversationJpaRepository.findByRepositoryIdAndUserIdOrderByCreatedAtDesc(repositoryId, userOpt.get().getId())
            .stream()
            .map(c -> new ConversationDto(
                c.getId(),
                c.getRepository().getId(),
                c.getTitle(),
                c.getCreatedAt()
            ))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getConversationsByRepository(UUID repositoryId) {
        return getConversations(repositoryId);
    }

    @Transactional(readOnly = true)
    public List<MessageDto> getConversationMessages(UUID conversationId) {
        return messageJpaRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
            .stream()
            .map(m -> new MessageDto(
                m.getId(),
                m.getConversation().getId(),
                m.getRole(),
                m.getContent(),
                m.getEvidence() != null ? m.getEvidence() : List.of(),
                m.getCreatedAt()
            ))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MessageDto> getMessagesByConversation(UUID conversationId) {
        return getConversationMessages(conversationId);
    }

    @Transactional
    public void deleteConversation(UUID conversationId) {
        UserEntity currentUser = currentUserService.getCurrentUserOrThrow();
        ConversationEntity entity = conversationJpaRepository.findByIdAndUserId(conversationId, currentUser.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with ID: " + conversationId));

        messageJpaRepository.deleteByConversationId(entity.getId());
        conversationJpaRepository.delete(entity);
    }

    @Transactional
    public ChatResponseDto sendMessage(ChatRequestDto request) {
        UserEntity currentUser = currentUserService.getCurrentUserOrThrow();
        RepositoryEntity repo = repositoryJpaRepository.findById(request.repositoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Repository not found with ID: " + request.repositoryId()));

        ConversationEntity conversation;
        if (request.conversationId() != null) {
            conversation = conversationJpaRepository.findByIdAndUserId(request.conversationId(), currentUser.getId())
                .orElseGet(() -> createNewConversation(repo, request.message(), currentUser));
        } else {
            conversation = createNewConversation(repo, request.message(), currentUser);
        }

        // Persist User Message
        MessageEntity userMsg = MessageEntity.builder()
            .conversation(conversation)
            .role(AppConstants.ROLE_USER)
            .content(request.message())
            .evidence(List.of())
            .build();
        messageJpaRepository.save(userMsg);

        // Forward to AI Service
        ChatRequestDto enrichedRequest = new ChatRequestDto(
            request.repositoryId(),
            request.message(),
            conversation.getId(),
            request.provider() != null ? request.provider() : AppConstants.DEFAULT_PROVIDER,
            request.customApiKey(),
            request.customModel(),
            request.customBaseUrl()
        );

        ChatResponseDto aiResponse = aiServiceClient.chat(enrichedRequest);

        // Persist Assistant Message
        MessageEntity assistantMsg = MessageEntity.builder()
            .conversation(conversation)
            .role(AppConstants.ROLE_ASSISTANT)
            .content(aiResponse.response())
            .evidence(aiResponse.evidence() != null ? aiResponse.evidence() : List.of())
            .build();
        messageJpaRepository.save(assistantMsg);

        return new ChatResponseDto(
            conversation.getId(),
            aiResponse.response(),
            aiResponse.evidence(),
            aiResponse.providerUsed()
        );
    }

    @Transactional
    public Flux<String> streamMessage(ChatRequestDto request) {
        UserEntity currentUser = currentUserService.getCurrentUserOrThrow();
        RepositoryEntity repo = repositoryJpaRepository.findById(request.repositoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Repository not found with ID: " + request.repositoryId()));

        ConversationEntity conversation;
        if (request.conversationId() != null) {
            conversation = conversationJpaRepository.findByIdAndUserId(request.conversationId(), currentUser.getId())
                .orElseGet(() -> createNewConversation(repo, request.message(), currentUser));
        } else {
            conversation = createNewConversation(repo, request.message(), currentUser);
        }

        // Persist User Message
        MessageEntity userMsg = MessageEntity.builder()
            .conversation(conversation)
            .role(AppConstants.ROLE_USER)
            .content(request.message())
            .evidence(List.of())
            .build();
        messageJpaRepository.save(userMsg);

        ChatRequestDto enrichedRequest = new ChatRequestDto(
            request.repositoryId(),
            request.message(),
            conversation.getId(),
            request.provider() != null ? request.provider() : AppConstants.DEFAULT_PROVIDER,
            request.customApiKey(),
            request.customModel(),
            request.customBaseUrl()
        );

        StringBuilder assistantContent = new StringBuilder();
        UUID convId = conversation.getId();

        return aiServiceClient.streamChat(enrichedRequest)
            .doOnNext(sseChunk -> {
                try {
                    String cleanChunk = sseChunk.trim();
                    if (cleanChunk.startsWith("data:")) {
                        cleanChunk = cleanChunk.substring(5).trim();
                    }
                    if (!cleanChunk.isEmpty()) {
                        JsonNode json = objectMapper.readTree(cleanChunk);
                        String type = json.path("type").asText();
                        if ("token".equals(type)) {
                            assistantContent.append(json.path("content").asText());
                        }
                    }
                } catch (Exception e) {
                    // Ignore non-json chunks
                }
            })
            .doOnComplete(() -> {
                try {
                    String fullResponse = assistantContent.toString();
                    if (!fullResponse.isBlank()) {
                        conversationJpaRepository.findById(convId).ifPresent(c -> {
                            MessageEntity assistantMsg = MessageEntity.builder()
                                .conversation(c)
                                .role(AppConstants.ROLE_ASSISTANT)
                                .content(fullResponse)
                                .evidence(List.of())
                                .build();
                            messageJpaRepository.save(assistantMsg);
                        });
                    }
                } catch (Exception e) {
                    log.warn("Failed to persist assistant stream message: {}", e.getMessage());
                }
            });
    }

    private ConversationEntity createNewConversation(RepositoryEntity repo, String firstMessage, UserEntity user) {
        String title = firstMessage != null && firstMessage.trim().length() > 0
            ? (firstMessage.length() > 36 ? firstMessage.substring(0, 36) + "..." : firstMessage)
            : AppConstants.CONVERSATION_TITLE_PREFIX + repo.getName();

        ConversationEntity entity = ConversationEntity.builder()
            .repository(repo)
            .user(user)
            .title(title)
            .build();
        return conversationJpaRepository.save(entity);
    }
}
