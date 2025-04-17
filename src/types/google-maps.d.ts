
declare namespace google {
  namespace maps {
    class Geocoder {
      geocode(
        request: {
          placeId?: string;
          address?: string;
        },
        callback: (
          results: google.maps.GeocoderResult[],
          status: google.maps.GeocoderStatus
        ) => void
      ): void;
    }

    namespace places {
      class AutocompleteService {
        getPlacePredictions(
          request: {
            input: string;
            types?: string[];
            componentRestrictions?: { country: string };
            sessionToken?: any;
          },
          callback: (
            results: google.maps.places.AutocompletePrediction[],
            status: google.maps.places.PlacesServiceStatus
          ) => void
        ): void;
      }

      class AutocompleteSessionToken {}

      interface AutocompletePrediction {
        description: string;
        place_id: string;
        structured_formatting?: {
          main_text: string;
          secondary_text: string;
        };
        terms?: {
          offset: number;
          value: string;
        }[];
        types?: string[];
      }

      enum PlacesServiceStatus {
        OK = "OK",
        ZERO_RESULTS = "ZERO_RESULTS",
        OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
        REQUEST_DENIED = "REQUEST_DENIED",
        INVALID_REQUEST = "INVALID_REQUEST",
        UNKNOWN_ERROR = "UNKNOWN_ERROR",
        NOT_FOUND = "NOT_FOUND",
      }
    }

    interface GeocoderResult {
      address_components: {
        long_name: string;
        short_name: string;
        types: string[];
      }[];
      formatted_address: string;
      geometry: {
        location: { lat: () => number; lng: () => number };
        viewport: {
          south: number;
          west: number;
          north: number;
          east: number;
        };
      };
      place_id: string;
      types: string[];
    }

    enum GeocoderStatus {
      OK = "OK",
      ZERO_RESULTS = "ZERO_RESULTS",
      OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
      REQUEST_DENIED = "REQUEST_DENIED",
      INVALID_REQUEST = "INVALID_REQUEST",
      UNKNOWN_ERROR = "UNKNOWN_ERROR",
    }
  }
}
