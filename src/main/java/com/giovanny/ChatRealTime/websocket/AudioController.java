package com.giovanny.ChatRealTime.websocket;

import com.giovanny.ChatRealTime.model.ChatMessage;
import java.io.IOException;
import java.util.Base64;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class AudioController {

    private final ChatWebSocketHandler webSocketHandler;

    @Autowired
    public AudioController(ChatWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @PostMapping(path = "/upload-audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAudio(@RequestParam("username") String username,
                                         @RequestParam("file") MultipartFile file) {
        if (username == null || username.isBlank() || file == null || file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("username and file are required");
        }

        try {
            byte[] bytes = IOUtils.toByteArray(file.getInputStream());
            String base64 = Base64.getEncoder().encodeToString(bytes);
            String dataUrl = "data:" + file.getContentType() + ";base64," + base64;

            ChatMessage chatMessage = new ChatMessage(username, dataUrl, "audio");
            webSocketHandler.broadcast(chatMessage);

            return ResponseEntity.ok().build();
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("failed to process file");
        }
    }
}

