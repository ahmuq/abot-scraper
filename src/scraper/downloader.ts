import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import qs from 'qs';
import {
    ApiResponse,
    FacebookResult,
    InstagramMediaItem,
    SfileDownloadResult,
    TikTokAdvancedResult,
    TikTokV2MediaItem,
    TikTokV2Result,
    YoutubeResultV2
} from '../../types/index.js';
import Generator from '../utils/generator.js';


interface YouTubeFormat {
    quality: string;
    video_url: string;
    [key: string]: unknown;
}

interface YouTubeMedia {
    media_type: string;
    preview_url?: string;
    resource_url?: string;
    formats?: YouTubeFormat[];
    [key: string]: unknown;
}

interface YouTubeApiResponse {
    text: string;
    medias: YouTubeMedia[];
}

declare global {
    // eslint-disable-next-line no-var
    var creator: string;
}

global.creator = '@abotscraper – ahmuq';

export default class Downloader {
    private generator: Generator;

    constructor() {
        this.generator = new Generator();
    }

    async facebookDownloader(url: string): Promise<ApiResponse<FacebookResult>> {
        try {
            const headers = {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0',
                Origin: 'https://www.fdown.world',
                referer: 'https://www.fdown.world/',
                'x-requested-with': 'XMLHttpRequest',
                Cookie: 'codehap_domain=www.fdown.world',
            };

            const data = new URLSearchParams({ codehap_link: url, codehap: 'true' });

            const response: AxiosResponse = await axios.post(
                'https://www.fdown.world/result.php',
                data,
                { headers }
            );

            const $ = cheerio.load(response.data);
            const videoUrl = $('video source').attr('src');
            const imageUrl = $('img').attr('src');

            if (!videoUrl && !imageUrl) {
                throw new Error('No video or image found in the response.');
            }

            return {
                creator: global.creator,
                status: 200,
                result: {
                    thumbnail: imageUrl || '',
                    videoUrl: videoUrl || '',
                },
            };
        } catch (error) {
            return {
                creator: global.creator,
                status: false,
                msg: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async tiktokDownloaderV1(url: string): Promise<ApiResponse<TikTokAdvancedResult>> {
        try {
            const headers = {
                'sec-ch-ua':
                    '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
                'user-agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            };

            const data = new URLSearchParams({
                id: url,
                locale: 'en',
                tt: 'WmNzZDk_',
            });

            const response: AxiosResponse = await axios.post(
                'https://ssstik.io/abc?url=dl',
                data,
                {
                    headers,
                }
            );

            const $ = cheerio.load(response.data);
            const author = $('h2').text().trim();
            const avatar = $('img.result_author').attr('src') || '';
            const caption = $('p.maintext').text().trim();

            let likes = 0;
            let comments = 0;
            let shares = 0;
            const likeText = $('div.d-flex:has(svg.feather-thumbs-up)').find('div').eq(1).text().trim();
            likes = parseInt(likeText.replace(/[K,]/g, (match) => {
                return match === 'K' ? '000' : '';
            })) || 0;

            const commentText = $('div.d-flex:has(svg.feather-message-square)').find('div').eq(1).text().trim();
            comments = parseInt(commentText.replace(/[K,]/g, (match) => {
                return match === 'K' ? '000' : '';
            })) || 0;

            const shareText = $('div.d-flex:has(svg.feather-share-2)').find('div').eq(1).text().trim();
            shares = parseInt(shareText.replace(/[K,]/g, (match) => {
                return match === 'K' ? '000' : '';
            })) || 0;

            const audioDownloadUrl = $('a.download_link.music').attr('href') || '';

            const slides = $('li.splide__slide');
            const isCarousel = slides.length > 0;

            if (isCarousel) {
                const images: string[] = [];

                slides.each((_index, element) => {
                    const $slide = $(element);
                    const downloadLink = $slide.find('a.download_link.slide').attr('href');

                    if (downloadLink) {
                        images.push(downloadLink);
                    }
                });

                if (images.length === 0) {
                    throw new Error('Failed to extract carousel slides from response.');
                }

                return {
                    creator: global.creator,
                    status: 200,
                    result: {
                        author,
                        caption,
                        avatar,
                        likes,
                        comments,
                        shares,
                        type: 'images',
                        images,
                        audioDownloadUrl,
                    },
                };
            } else {
                const videoDownloadUrl = $('a.download_link.without_watermark').attr('href') ||
                    $('a#hd_download').attr('data-directurl') ||
                    $('a.download_link.without_watermark_hd').attr('data-directurl') || '';

                if (!author || !caption || !videoDownloadUrl) {
                    throw new Error('Failed to extract required TikTok data from response.');
                }

                return {
                    creator: global.creator,
                    status: 200,
                    result: {
                        author,
                        caption,
                        avatar,
                        likes,
                        comments,
                        shares,
                        type: 'video',
                        videoDownloadUrl,
                        audioDownloadUrl,
                    },
                };
            }
        } catch (error) {
            return {
                creator: global.creator,
                status: false,
                msg: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async tiktokDownloaderV2(url: string): Promise<ApiResponse<TikTokV2Result>> {
        try {

            const headers = {
                accept: '*/*',
                'accept-language': 'en-US,en;q=0.9,ar;q=0.8,id;q=0.7,vi;q=0.6',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                priority: 'u=1, i',
                referer: 'https://tikdown.com/en',
                'sec-ch-ua':
                    '"Chromium";v="142", "Microsoft Edge";v="142", "Not_A Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'x-requested-with': 'XMLHttpRequest',
            };

            const data = new URLSearchParams({ url });

            const response: AxiosResponse = await axios.post(
                'https://tikdown.com/proxy.php',
                data,
                {
                    headers,
                    withCredentials: true
                }
            );

            const apiData = response.data.api;

            if (!apiData || apiData.status !== 'OK') {
                throw new Error('Failed to retrieve TikTok data from the response.');
            }

            const mediaStats = apiData.mediaStats || {};
            let likes = 0;
            let comments = 0;
            let shares = 0;
            let views = 0;

            if (typeof mediaStats.likesCount === 'string') {
                likes = parseInt(mediaStats.likesCount.replace(/[K,M]/g, '')) || 0;
            } else {
                likes = mediaStats.likesCount || 0;
            }

            if (typeof mediaStats.commentsCount === 'string') {
                comments = parseInt(mediaStats.commentsCount.replace(/[K,M]/g, '')) || 0;
            } else {
                comments = mediaStats.commentsCount || 0;
            }

            if (typeof mediaStats.sharesCount === 'string') {
                shares = parseInt(mediaStats.sharesCount.replace(/[K,M]/g, '')) || 0;
            } else {
                shares = mediaStats.sharesCount || 0;
            }

            if (typeof mediaStats.viewsCount === 'string') {
                views = parseInt(mediaStats.viewsCount.replace(/[K,M]/g, '')) || 0;
            } else {
                views = mediaStats.viewsCount || 0;
            }

            const userInfo = apiData.userInfo || {};
            const rawMediaItems = (apiData.mediaItems || []) as Array<Record<string, unknown>>;

            const mediaItems: TikTokV2MediaItem[] = await Promise.all(
                rawMediaItems.map(async (item: Record<string, unknown>): Promise<TikTokV2MediaItem> => {
                    const type = (item.type as 'Video' | 'Image' | 'Music') || 'Video';
                    const mediaUrl = (item.mediaUrl as string) || '';
                    const quality = (item.mediaQuality as string | undefined) || undefined;
                    const fileSize = (item.mediaFileSize as string | undefined) || undefined;

                    if (type === 'Image') {
                        const result: TikTokV2MediaItem = {
                            type,
                            fileUrl: mediaUrl,
                        };
                        if (quality !== undefined) result.quality = quality;
                        if (fileSize !== undefined) result.fileSize = fileSize;
                        return result;
                    }

                    try {
                        if (type === 'Video' || type === 'Music') {
                            const fileResponse = await axios.get(mediaUrl, { headers });
                            const fileData = fileResponse.data;

                            const result: TikTokV2MediaItem = {
                                type,
                                fileUrl: (fileData.fileUrl as string) || mediaUrl,
                            };
                            const resolvedQuality = quality || (fileData.quality as string | undefined);
                            const resolvedFileSize = fileSize || (fileData.fileSize as string | undefined);
                            if (resolvedQuality !== undefined) result.quality = resolvedQuality;
                            if (resolvedFileSize !== undefined) result.fileSize = resolvedFileSize;
                            return result;
                        }
                    } catch {
                        // none
                    }

                    const result: TikTokV2MediaItem = {
                        type,
                        fileUrl: mediaUrl,
                    };
                    if (quality !== undefined) result.quality = quality;
                    if (fileSize !== undefined) result.fileSize = fileSize;
                    return result;
                })
            );

            return {
                creator: global.creator,
                status: 200,
                result: {
                    author: userInfo.name || apiData.title || '',
                    username: userInfo.username || '',
                    caption: apiData.description || '',
                    avatar: userInfo.userAvatar || '',
                    likes,
                    comments,
                    shares,
                    views,
                    previewUrl: apiData.previewUrl || apiData.imagePreviewUrl || '',
                    mediaItems,
                },
            };
        } catch (error) {
            return {
                creator: global.creator,
                status: false,
                msg: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async instagramDownloader(url: string): Promise<ApiResponse<InstagramMediaItem[]>> {
        try {
            const payload = new URLSearchParams({ url });
            const headers = {
                accept: '*/*',
                'accept-language': 'en-US,en;q=0.9,ar;q=0.8,id;q=0.7,vi;q=0.6',
                'content-type': 'application/x-www-form-urlencoded',
                priority: 'u=1, i',
                'sec-ch-ua':
                    '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
            };

            const response: AxiosResponse = await axios.post(
                'https://snapinsta.llc/process',
                payload,
                { headers }
            );

            const $ = cheerio.load(response.data);
            const downloadItems: InstagramMediaItem[] = [];
            $('.download-item').each((_index, element) => {
                const $element = $(element);
                const previewImg = $element.find('.media-box img').attr('src');
                const downloadLink = $element.find('.download-media').attr('href');
                const downloadText = $element.find('.download-media').text().trim();
                const isVideo = downloadText.toLowerCase().includes('video') ||
                    $element.find('.icon-downvid').length > 0;
                if (downloadLink) {
                    const mediaItem: InstagramMediaItem = {
                        type: isVideo ? 'video' : 'image',
                        url: downloadLink
                    };
                    if (previewImg) {
                        mediaItem.preview = previewImg;
                    }
                    downloadItems.push(mediaItem);
                }
            });
            if (downloadItems.length === 0) {
                throw new Error('No media items found in the response.');
            }
            return {
                creator: global.creator,
                status: 200,
                result: downloadItems,
            };
        } catch (error) {
            return {
                creator: global.creator,
                status: false,
                msg: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    ytMp3Downloader = (url: string) => {
        return new Promise((resolve, reject) => {
            const headers = {
                accept: "*/*",
                "accept-language": "en-US,en;q=0.9,ar;q=0.8,id;q=0.7,vi;q=0.6",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                priority: "u=1, i",
                "sec-ch-ua":
                    '"Microsoft Edge";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                Referer: "https://y2hub.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin",
            };

            const payload = qs.stringify({
                action: "yt_convert",
                nonce: "1495b10e48",
                youtube_url: url,
            });

            axios(`https://youtubemp4free.com/wp-admin/admin-ajax.php`, {
                method: "POST",
                headers: headers,
                data: payload,
            })
                .then(({ data }) => {
                    if (!data.success) {
                        return reject(new Error("Failed to fetch video data"));
                    }

                    const videoInfo = data.data.info;
                    const slug = data.data.slug;
                    const size = data.data.size;
                    return axios("https://ryin.info/", {
                        method: "GET",
                        headers: {
                            "User-Agent":
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0",
                        },
                    }).then((response) => {
                        const setCookieHeaders = response.headers["set-cookie"];
                        let cookies;

                        if (setCookieHeaders) {
                            cookies = setCookieHeaders
                                .map((cookie) => cookie.split(";")[0])
                                .join("; ");
                        } else {
                            cookies =
                                "PHPSESSID=fl86pmq4dqgh2835b32mdm7380; csrf_cookie_name=739e04fcc21050c61c5325b34f449659; lang=en";
                        }

                        const pageUrl = "https://ryin.info/" + slug;

                        return axios(pageUrl, {
                            method: "GET",
                            headers: {
                                "User-Agent":
                                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0",
                                Cookie: cookies,
                            },
                        }).then((response) => {
                            const html = response.data;
                            const $ = cheerio.load(html);
                            const downloadHref = $("#download-url").attr("download-href");

                            if (!downloadHref) {
                                return reject(new Error("Download link not found on page"));
                            }
                            resolve({
                                creator: global.creator,
                                status: true,
                                title: videoInfo.title,
                                thumbnail: videoInfo.thumbnail,
                                description: videoInfo.description,
                                viewCount: videoInfo.view_count,
                                size: this.generator.formatFileSize(size),
                                downloadUrl: downloadHref,
                            });
                        });
                    });
                })
                .catch((error) => {
                    reject({
                        creator: global.creator,
                        status: false,
                        error: error.message,
                    });
                });
        });
    };


    async youtubeDownloader(url: string): Promise<ApiResponse<YoutubeResultV2>> {
        try {
            const timestamp = this.generator.generateTimeStampYoutubeDL();
            const footer = this.generator.generateFooterYoutubeDL(timestamp, url);

            const payload = {
                link: url,
            };

            const headers = {
                'user-agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'g-footer': footer,
                'g-timestamp': timestamp,
                accept: '*/*',
                'accept-language': 'en',
                'content-type': 'application/json',
                priority: 'u=1, i',
                'sec-ch-ua':
                    '"Microsoft Edge";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                Referer: 'https://snapany.com/',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
            };

            const response: AxiosResponse<YouTubeApiResponse> = await axios.post(
                'https://api.snapany.com/v1/extract',
                payload,
                { headers }
            );
            const data = response.data;

            const videoMedia = data.medias.find(
                (media: YouTubeMedia) => media.media_type === 'video'
            );
            const audioMedia = data.medias.find(
                (media: YouTubeMedia) => media.media_type === 'audio'
            );

            const downloadLinks: Record<string, string> = {};
            if (videoMedia && videoMedia.formats) {
                videoMedia.formats.forEach((format: YouTubeFormat) => {
                    const qualityKey = `${format.quality}p`;
                    downloadLinks[qualityKey] = format.video_url;
                });
            }

            return {
                creator: global.creator,
                status: 200,
                result: {
                    title: data.text,
                    thumbnail: videoMedia?.preview_url || null,
                    downloadLinks: downloadLinks,
                    video: videoMedia?.resource_url || null,
                    audio: audioMedia?.resource_url || null,
                    formats: videoMedia?.formats || [],
                },
            };
        } catch (error) {
            return {
                creator: global.creator,
                status: false,
                msg: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async sfileDownloader(url: string): Promise<ApiResponse<SfileDownloadResult>> {
        try {
            const response: AxiosResponse = await axios.get(url, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    Referer: 'https://sfile.mobi/',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            });

            const $ = cheerio.load(response.data);
            const filename = $('.intro-container img').attr('alt') || '';
            const mimetype = $('div.list').text().split(' - ')[1]?.split('\n')[0] || '';
            const downloadHref = $('#download').attr('href');
            const download = downloadHref
                ? downloadHref + '&k=' + Math.floor(Math.random() * (15 - 10 + 1) + 10)
                : '';

            return {
                creator: global.creator,
                status: 200,
                result: { filename, mimetype, download },
            };
        } catch (error) {
            return {
                creator: global.creator,
                status: false,
                msg: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
