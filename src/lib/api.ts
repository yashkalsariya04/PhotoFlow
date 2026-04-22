export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://photoflow.in/api';

class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = sessionStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    sessionStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    sessionStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      ...options.headers,
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Fetch binary data (images) with auth headers
  async fetchBinary(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      ...options.headers,
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'Request failed');
      throw new Error(text || `HTTP ${response.status}`);
    }

    return response.blob();
  }

  // Auth
  async register(data: { name: string; email: string; password: string }) {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(result.token);
    return result;
  }

  async adminRegisterUser(data: { name: string; email: string; password: string }) {
    return this.request('/auth/admin-register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendPasswordEmail(data: { email: string; password: string }) {
    return this.request('/auth/send-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(data: { email: string; newPassword: string }) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(result.token);
    return result;
  }

  async faceLogin(selfie: Blob) {
    const formData = new FormData();
    formData.append('selfie', selfie);
    const result = await this.request('/auth/face-login', {
      method: 'POST',
      body: formData,
    });
    this.setToken(result.token);
    return result;
  }

  async enrollFace(selfie: Blob) {
    const formData = new FormData();
    formData.append('selfie', selfie);
    return this.request('/auth/enroll-face', {
      method: 'POST',
      body: formData,
    });
  }

  async removeFaceEnrollment() {
    return this.request('/auth/enroll-face', {
      method: 'DELETE',
    });
  }

  logout() {
    this.clearToken();
  }

  // Events
  async createEvent(data: { 
    title: string; 
    description?: string; 
    eventDate: string; 
  }) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEvents() {
    return this.request('/events');
  }

  async getAllEvents() {
    return this.request('/events/all');
  }

  async deleteEvent(eventId: string) {
    return this.request(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async getEvent(eventId: string) {
    return this.request(`/events/${eventId}`);
  }

  async updateEvent(eventId: string, data: { 
    title: string; 
    description?: string; 
    eventDate: string; 
    isActive?: boolean; 
  }) {
    return this.request(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getEventByCode(code: string) {
    return this.request(`/events/access/${code}`);
  }

  // Photos
  async uploadPhoto(file: File, eventId?: string, onProgress?: (percent: number) => void) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      if (eventId) {
        formData.append('eventId', eventId);
      }

      xhr.open('POST', `${this.baseURL}/photos/upload`);

      if (this.token) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      }

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || `HTTP ${xhr.status}`));
          } catch (e) {
            reject(new Error(`HTTP ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
  }

  async getPhotos(params?: { page?: number; limit?: number; tags?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.tags) query.append('tags', params.tags);

    return this.request(`/photos?${query.toString()}`);
  }

  async getStorageUsage() {
    return this.request('/photos/storage/usage');
  }

  async getEventPhotos(eventId: string, page = 1, limit?: number) {
    const query = new URLSearchParams();
    query.append('page', page.toString());
    if (limit) {
      query.append('limit', limit.toString());
    }
    return this.request(`/photos/event/${eventId}?${query.toString()}`);
  }

  async deletePhoto(photoId: string) {
    return this.request(`/photos/${photoId}`, {
      method: 'DELETE',
    });
  }

  async deletePhotos(photoIds: string[]) {
    return this.request(`/photos/batch`, {
      method: 'DELETE',
      body: JSON.stringify({ photoIds }),
    });
  }

  getPhotoUrl(photoId: string) {
    return `${this.baseURL}/photos/${photoId}/download`;
  }

  getThumbnailUrl(photoId: string) {
    return `${this.baseURL}/photos/${photoId}/thumbnail`;
  }

  getPublicThumbnailUrl(photoId: string) {
    return `${this.baseURL}/photos/${photoId}/thumbnail/public`;
  }
  
  getPublicPhotoUrl(photoId: string) {
    return `${this.baseURL}/photos/${photoId}/public`;
  }

  // Return thumbnail blob for creating object URLs (authenticated)
  async getThumbnailBlob(photoId: string) {
    return this.fetchBinary(`/photos/${photoId}/thumbnail`);
  }

  // Profile
  async updateProfile(formData: FormData) {
    // Use fetch to allow multipart/form-data
    const headers: HeadersInit = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const resp = await fetch(`${this.baseURL}/users/profile`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => 'Request failed');
      throw new Error(text || `HTTP ${resp.status}`);
    }

    return resp.json();
  }

  getAvatarUrl(userId: string, version?: string) {
    const url = `${this.baseURL}/users/${userId}/avatar`;
    return version ? `${url}?v=${version}` : url;
  }

  async getAvatarBlob(userId: string) {
    return this.fetchBinary(`/users/${userId}/avatar`);
  }

  async getCurrentUser() {
    return this.request('/users/profile');
  }

  async getAllUsers() {
    return this.request(`/users?t=${Date.now()}`);
  }

  async adminCreateUser(data: { name: string; email: string; role?: string }) {
    return this.request('/users/admin-create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(userId: string, data: { name?: string; email?: string; role?: string; isActive?: boolean }) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Client Access
  async recognizeFace(code: string, data: { clientName: string; clientEmail?: string; clientPhone?: string; selfie: File }) {
    const formData = new FormData();
    formData.append('clientName', data.clientName);
    if (data.clientEmail) formData.append('clientEmail', data.clientEmail);
    if (data.clientPhone) formData.append('clientPhone', data.clientPhone);
    formData.append('selfie', data.selfie);

    return this.request(`/events/access/${code}/recognize`, {
      method: 'POST',
      body: formData,
    });
  }

  async validateSelfie(selfie: File) {
    const formData = new FormData();
    formData.append('selfie', selfie);

    return this.request('/events/access/validate-selfie', {
      method: 'POST',
      body: formData,
    });
  }

  async getClientPhotos(clientAccessId: string) {
    return this.request(`/events/client/${clientAccessId}`);
  }

  // Face Recognition Test Endpoints
  async getFaceRecognitionStatus() {
    return this.request('/face-recognition/status');
  }

  async detectFaces(image: File, detector: 'ssd' | 'tiny' | 'mtcnn' = 'ssd') {
    const formData = new FormData();
    formData.append('image', image);
    return this.request(`/face-recognition/detect?detector=${detector}`, {
      method: 'POST',
      body: formData,
    });
  }

  // Albums (kept for backwards compatibility)
  async createAlbum(data: {
    title: string;
    isSmart?: boolean;
    tagRules?: string[];
    photoIds?: string[];
  }) {
    return this.request('/albums', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAlbums() {
    return this.request('/albums');
  }

  // AI - Ghibli conversion (public)
  async convertToGhibli(image: File) {
    const formData = new FormData();
    formData.append('image', image);
    const resp = await fetch(`${this.baseURL}/ai/ghibli`, {
      method: 'POST',
      body: formData,
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => 'Request failed');
      throw new Error(text || `HTTP ${resp.status}`);
    }
    return resp.blob();
  }
}

export const api = new ApiClient();
