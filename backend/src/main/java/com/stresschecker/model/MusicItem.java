package com.stresschecker.model;

public class MusicItem {
    private int id;
    private String title;
    private String url;
    private String thumbnail;
    private String category;

    public MusicItem(int id, String title, String url, String thumbnail, String category) {
        this.id = id;
        this.title = title;
        this.url = url;
        this.thumbnail = thumbnail;
        this.category = category;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getThumbnail() { return thumbnail; }
    public void setThumbnail(String thumbnail) { this.thumbnail = thumbnail; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
