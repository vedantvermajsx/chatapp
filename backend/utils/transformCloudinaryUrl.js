function transformCloudinaryUrl(
  url,
  transformations = "w_50,h_50,c_fill"
) {
  if (!url || !url.includes("/upload/")) {
    return url;
  }

  return url.replace(
    "/upload/",
    `/upload/${transformations}/`
  );
}

export default transformCloudinaryUrl;