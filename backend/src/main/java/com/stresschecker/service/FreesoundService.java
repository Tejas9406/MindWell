package com.stresschecker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stresschecker.model.MusicItem;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

@Service
public class FreesoundService {

    private final String apiKey;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private static final String BASE_URL = "https://freesound.org/apiv2/search/text/";

    public FreesoundService() {
        Dotenv dotenv = Dotenv.load();
        this.apiKey = dotenv.get("FREESOUND_API_KEY");
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public List<MusicItem> searchSounds(String query) {
        List<MusicItem> musicList = new ArrayList<>();
        try {
            String filter = "duration:[60 TO 600]";

            String fields = "id,name,previews,images,username";

            String url = UriComponentsBuilder.fromHttpUrl(BASE_URL)
                    .queryParam("query", query)
                    .queryParam("token", apiKey)
                    .queryParam("filter", filter)
                    .queryParam("fields", fields)
                    .queryParam("page_size", 10)
                    .queryParam("sort", "rating_desc")
                    .encode()
                    .toUriString();

            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            JsonNode results = root.path("results");

            if (results.isArray()) {
                for (JsonNode node : results) {
                    int id = node.path("id").asInt();
                    String title = node.path("name").asText();
                    String audioUrl = node.path("previews").path("preview-hq-mp3").asText();
                    if (audioUrl == null || audioUrl.isEmpty()) {
                        audioUrl = node.path("previews").path("preview-lq-mp3").asText();
                    }

                    String thumbnail = node.path("images").path("waveform_m").asText();
                    if (thumbnail == null || thumbnail.isEmpty()) {
                        thumbnail = "https://via.placeholder.com/300x200?text=Audio+Waveform";
                    }

                    if (title.endsWith(".wav") || title.endsWith(".mp3")) {
                        title = title.substring(0, title.length() - 4);
                    }

                    musicList.add(new MusicItem(id, title, audioUrl, thumbnail, query));
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error searching Freesound: " + e.getMessage());
        }
        return musicList;
    }
}
