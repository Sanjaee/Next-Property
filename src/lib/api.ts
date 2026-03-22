// API client for authentication only
import type {
  RegisterRequest,
  LoginRequest,
  OTPVerifyRequest,
  ResendOTPRequest,
  ResetPasswordRequest,
  VerifyResetPasswordRequest,
  RegisterResponse,
  AuthResponse,
  OTPVerifyResponse,
  ResendOTPResponse,
  ResetPasswordResponse,
  VerifyResetPasswordResponse,
  GoogleOAuthRequest,
} from "@/types/auth";

// Use local API routes - set to empty string for relative URLs in browser
const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000");

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Set access token for authenticated requests
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add Authorization header if access token is available
    if (this.accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.accessToken}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Extract error message from nested error object if present
        let errorMessage =
          errorData.message ||
          errorData.error?.message ||
          (typeof errorData.error === "string" ? errorData.error : null) ||
          `HTTP ${response.status}: ${response.statusText}`;

        // Handle data wrapper if present
        if (errorData.data && typeof errorData.data === "object") {
          errorMessage =
            errorData.data.message ||
            errorData.data.error?.message ||
            errorMessage;
        }

        // Ensure we have a string message, not an object
        if (typeof errorMessage !== "string") {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        // Create error with response data preserved
        const error = new Error(errorMessage) as Error & {
          response?: {
            status: number;
            data: unknown;
          };
        };

        error.response = {
          status: response.status,
          data: errorData,
        };

        throw error;
      }

      const data = await response.json();

      // Unwrap data if response is wrapped in { data: ... }
      if (data.data) {
        return data.data;
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Authentication endpoints - using local Next.js API routes
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyOTP(data: OTPVerifyRequest): Promise<OTPVerifyResponse> {
    return this.request<OTPVerifyResponse>("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async resendOTP(data: ResendOTPRequest): Promise<ResendOTPResponse> {
    return this.request<ResendOTPResponse>("/api/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async googleOAuth(data: GoogleOAuthRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/google-oauth", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async requestResetPassword(
    data: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    return this.request<ResetPasswordResponse>(
      "/api/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async verifyResetPassword(
    data: VerifyResetPasswordRequest
  ): Promise<VerifyResetPasswordResponse> {
    return this.request<VerifyResetPasswordResponse>(
      "/api/auth/verify-reset-password",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async resetPassword(data: {
    token: string;
    newPassword: string;
    email?: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ 
        email: data.email,
        otp_code: data.token, 
        new_password: data.newPassword 
      }),
    });
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }
}

// Create API client instance
export const api = new ApiClient(API_BASE_URL);

// Token management utilities
export class TokenManager {
  private static ACCESS_TOKEN_KEY = "access_token";
  private static REFRESH_TOKEN_KEY = "refresh_token";

  static setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  static getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  static getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  static clearTokens(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  static async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await api.refreshToken(refreshToken);
      this.setTokens(response.access_token, response.refresh_token);
      return response.access_token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearTokens();
      return null;
    }
  }
}
