# idf_component_register(SRCS "main.c"
#                     INCLUDE_DIRS ".")

idf_component_register(
    SRCS "main.c"
    INCLUDE_DIRS "."
    REQUIRES esp_http_server esp_wifi nvs_flash esp_adc driver esp_netif esp_event esp_timer
    EMBED_FILES "web/index.html.gz")