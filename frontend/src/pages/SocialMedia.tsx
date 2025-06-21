import React, { useState, useEffect, useCallback } from 'react';
import { SocialMediaPost } from '../types';
import { ApiService } from '../services/api';

const SocialMedia: React.FC = () => {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [officialUpdates, setOfficialUpdates] = useState<SocialMediaPost[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeywords, setSearchKeywords] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<'bluesky' | 'all'>('bluesky');
  const [newMessage, setNewMessage] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const platform = selectedPlatform === 'all' ? '' : selectedPlatform;
      const socialPosts = await ApiService.getSocialMediaPosts(undefined, platform, 50);
      setPosts(socialPosts);
      const official = await ApiService.getOfficialUpdates([]);
      setOfficialUpdates(official);
      const trending = await ApiService.getTrendingTopics();
      setTrendingTopics(trending);
    } catch (error) {
      console.error('Error fetching social media data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPlatform]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = async () => {
    if (!searchKeywords.trim()) {
      fetchData();
      return;
    }
    try {
      setLoading(true);
      const keywords = searchKeywords.split(',').map(k => k.trim());
      const platform = selectedPlatform === 'all' ? '' : selectedPlatform;
      const searchPosts = await ApiService.getSocialMediaPosts(undefined, platform, 50);
      const filteredPosts = searchPosts.filter((post: SocialMediaPost) =>
        keywords.some(keyword =>
          post.content.toLowerCase().includes(keyword.toLowerCase()) ||
          post.user.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error searching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const success = await ApiService.postMessage(newMessage);
      if (success) {
        setNewMessage('');
        fetchData();
        alert('Message posted successfully!');
      } else {
        alert('Failed to post message');
      }
    } catch (error) {
      console.error('Error posting message:', error);
      alert('Error posting message');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 font-bold';
      case 'high': return 'text-orange-600 font-semibold';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'bluesky':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="border-b border-gray-200 py-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Media Monitoring</h1>
          <p className="text-gray-600">Monitor disaster-related posts from Bluesky and other platforms</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Keywords</label>
              <input
                type="text"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                placeholder="Enter keywords separated by commas"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as 'bluesky' | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bluesky">Bluesky</option>
                <option value="all">All Platforms</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchData}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Social Media Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Social Media Feed</h2>
                <p className="text-sm text-gray-600 mt-1">{posts.length} posts found</p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {posts.map((post) => (
                  <div key={post.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getPlatformIcon(post.platform)}
                        <span className="text-sm font-medium text-gray-900">@{post.user}</span>
                        <span className="text-xs text-gray-500">• {new Date(post.timestamp).toLocaleString()}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(post.priority)}`}>
                        {post.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-800 mb-3">{post.content}</p>
                    
                    {post.engagement && (
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>❤️ {post.engagement.likes}</span>
                        <span>🔄 {post.engagement.retweets}</span>
                        <span>💬 {post.engagement.replies}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {posts.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No posts found. Try adjusting your search criteria.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Official Updates */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Official Updates</h3>
                <p className="text-sm text-gray-600 mt-1">{officialUpdates.length} updates</p>
              </div>
              
              <div className="p-6 space-y-4">
                {officialUpdates.slice(0, 5).map((update) => (
                  <div key={update.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {getPlatformIcon(update.platform)}
                      <span className="text-sm font-medium text-gray-900">@{update.user}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{update.content}</p>
                    <span className="text-xs text-gray-500">{new Date(update.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Trending Topics</h3>
              </div>
              
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {trendingTopics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full cursor-pointer hover:bg-blue-200"
                      onClick={() => {
                        setSearchKeywords(topic);
                        handleSearch();
                      }}
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Post Message */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Post Official Update</h3>
              </div>
              
              <div className="p-6">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Enter your official update message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
                <button
                  onClick={handlePostMessage}
                  disabled={!newMessage.trim()}
                  className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Post to Bluesky
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMedia; 