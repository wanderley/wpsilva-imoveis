interface ValidatedAddress {
  formatted_address: string;
  street_number?: string;
  route?: string;
  sublocality?: string;
  subpremise?: string;
  administrative_area_level_2?: string;
  administrative_area_level_1?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
}

interface AddressValidationResponse {
  result: {
    verdict: {
      validationGranularity: string;
      hasInferredComponents: boolean;
      hasUnconfirmedComponents: boolean;
    };
    address: {
      formattedAddress: string;
      postalAddress: {
        regionCode: string;
        languageCode: string;
        postalCode: string;
        administrativeArea: string;
        locality: string;
        sublocality: string;
        addressLines: string[];
      };
      addressComponents: {
        componentType: string;
        componentName: {
          text: string;
          languageCode: string;
        };
        confirmationLevel: string;
      }[];
    };
    geocode: {
      location: {
        latitude: number;
        longitude: number;
      };
    };
  };
}

export async function validateAddress(
  address: string,
): Promise<ValidatedAddress | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not set");
  }

  const url = "https://addressvalidation.googleapis.com/v1:validateAddress";
  const body = {
    address: {
      regionCode: "BR",
      languageCode: "pt",
      addressLines: [address],
    },
  };

  try {
    const response = await fetch(`${url}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as AddressValidationResponse;

    if (!data.result?.address) {
      return null;
    }

    const getComponent = (type: string) =>
      data.result.address.addressComponents.find(
        (c) => c.componentType === type,
      )?.componentName.text;

    return {
      formatted_address: data.result.address.formattedAddress,
      street_number: getComponent("street_number"),
      route: getComponent("route"),
      sublocality: data.result.address.postalAddress.sublocality,
      subpremise: getComponent("subpremise"),
      administrative_area_level_2: data.result.address.postalAddress.locality,
      administrative_area_level_1:
        data.result.address.postalAddress.administrativeArea,
      country: "Brasil",
      postal_code: data.result.address.postalAddress.postalCode,
      latitude: data.result.geocode?.location.latitude,
      longitude: data.result.geocode?.location.longitude,
    };
  } catch (error) {
    console.error("Error validating address:", error);
    return null;
  }
}
