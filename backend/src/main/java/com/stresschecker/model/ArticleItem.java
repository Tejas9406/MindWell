package com.stresschecker.model;

public class ArticleItem {
    private int id;
    private String title;
    private String summary;
    private String url;
    private String image;
    private String source;

    public ArticleItem(int id, String title, String summary, String url, String image, String source) {
        this.id = id;
        this.title = title;
        this.summary = summary;
        this.url = url;
        this.image = image;
        this.source = source;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
