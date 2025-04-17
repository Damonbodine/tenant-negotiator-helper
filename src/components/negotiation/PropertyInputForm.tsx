
import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dices, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PropertyDetails } from "./types";
import { generateRandomProperty } from "@/utils/randomPropertyGenerator";
import { useEffect, useState, useRef } from "react";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const formSchema = z.object({
  address: z.string().min(3, {
    message: "Address must be at least 3 characters.",
  }),
  zipCode: z.string().min(5, {
    message: "Zip code must be at least 5 characters.",
  }),
  bedrooms: z.number().min(1, {
    message: "Must have at least 1 bedroom.",
  }).default(1),
  bathrooms: z.number().min(1, {
    message: "Must have at least 1 bathroom.",
  }).default(1),
  price: z.number().min(1, {
    message: "Price must be greater than 0.",
  }),
  propertyType: z.string().min(3, {
    message: "Property type must be at least 3 characters.",
  }),
  squareFootage: z.number().min(100, {
    message: "Square footage must be at least 100.",
  }),
});

interface PropertyInputFormProps {
  onSubmit: (data: PropertyDetails) => void;
  isLoading: boolean;
}

interface AddressPrediction {
  description: string;
  place_id: string;
  zipCode?: string;
}

export function PropertyInputForm({ onSubmit, isLoading }: PropertyInputFormProps) {
  const [addressQuery, setAddressQuery] = useState("");
  const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
  const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const autocompleteSessionTokenRef = useRef<any>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      zipCode: "",
      bedrooms: 1,
      bathrooms: 1,
      price: 0,
      propertyType: "Apartment",
      squareFootage: 0
    }
  });

  // Initialize Google Maps services
  useEffect(() => {
    // Check if Google Maps script is already loaded
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD_iuAHDMlLbjKk5dZKl69nHB7TvwV3jn0&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = initializeServices;
      document.head.appendChild(script);
    } else {
      initializeServices();
    }

    return () => {
      // Clean up session token when component unmounts
      autocompleteSessionTokenRef.current = null;
    };
  }, []);

  const initializeServices = () => {
    if (window.google) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      geocoderRef.current = new google.maps.Geocoder();
      autocompleteSessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      console.log("Google Maps services initialized");
    }
  };

  // Address autocomplete search
  useEffect(() => {
    if (!addressQuery || addressQuery.length < 3 || !autocompleteServiceRef.current) {
      setPredictions([]);
      return;
    }

    const searchTimer = setTimeout(() => {
      autocompleteServiceRef.current!.getPlacePredictions({
        input: addressQuery,
        types: ["address"],
        componentRestrictions: { country: "us" },
        sessionToken: autocompleteSessionTokenRef.current
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          console.log("Autocomplete results:", results);
          setPredictions(results as AddressPrediction[]);
        } else {
          setPredictions([]);
        }
      });
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [addressQuery]);

  const handleAddressSelect = (prediction: AddressPrediction) => {
    setSelectedAddress(prediction.description);
    form.setValue("address", prediction.description);
    setIsAddressSearchOpen(false);

    // Get ZIP code using Geocoder
    if (geocoderRef.current && prediction.place_id) {
      geocoderRef.current.geocode({ placeId: prediction.place_id }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          // Extract zip code from address components
          const addressComponents = results[0].address_components;
          const zipComponent = addressComponents.find(component => 
            component.types.includes("postal_code")
          );

          if (zipComponent) {
            const zipCode = zipComponent.short_name;
            console.log("Found ZIP code:", zipCode);
            form.setValue("zipCode", zipCode);
            
            // Create a new session token for the next search
            autocompleteSessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
          }
        }
      });
    }
  };

  const handleGenerateRandom = () => {
    const randomProperty = generateRandomProperty();
    form.reset(randomProperty);
    setSelectedAddress(randomProperty.address);
    onSubmit(randomProperty);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Popover open={isAddressSearchOpen} onOpenChange={setIsAddressSearchOpen}>
                  <PopoverTrigger asChild>
                    <div className="flex">
                      <Input
                        placeholder="123 Main St"
                        value={selectedAddress || form.watch("address")}
                        onChange={(e) => {
                          setAddressQuery(e.target.value);
                          setSelectedAddress(e.target.value);
                          form.setValue("address", e.target.value);
                          setIsAddressSearchOpen(true);
                        }}
                        className="flex-1 rounded-r-none"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddressSearchOpen(true)}
                        className="rounded-l-none border-l-0"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start" side="bottom" sideOffset={5}>
                    <Command className="rounded-lg border shadow-md">
                      <CommandInput 
                        placeholder="Search for an address..." 
                        value={addressQuery}
                        onValueChange={setAddressQuery}
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No addresses found.</CommandEmpty>
                        {predictions.map((prediction) => (
                          <CommandItem
                            key={prediction.place_id}
                            onSelect={() => handleAddressSelect(prediction)}
                            className="cursor-pointer"
                          >
                            {prediction.description}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <div>
            <FormItem>
              <FormLabel>Zip Code</FormLabel>
              <FormControl>
                <Input placeholder="90210" {...form.register("zipCode")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FormItem>
              <FormLabel>Bedrooms</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1"
                  {...form.register("bedrooms", { valueAsNumber: true })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <div>
            <FormItem>
              <FormLabel>Bathrooms</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1"
                  {...form.register("bathrooms", { valueAsNumber: true })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <div>
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="2500"
                  {...form.register("price", { valueAsNumber: true })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormItem>
              <FormLabel>Property Type</FormLabel>
              <FormControl>
                <Select onValueChange={(value) => form.setValue("propertyType", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Condo">Condo</SelectItem>
                    <SelectItem value="House">House</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                    <SelectItem value="Loft">Loft</SelectItem>
                    <SelectItem value="Studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <div>
            <FormItem>
              <FormLabel>Square Footage</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="800"
                  {...form.register("squareFootage", { valueAsNumber: true })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="flex-1"
          >
            Analyze Property
          </Button>
          <Button 
            type="button"
            variant="outline"
            onClick={handleGenerateRandom}
            disabled={isLoading}
            className="flex gap-2"
          >
            <Dices className="h-4 w-4" />
            Random
          </Button>
        </div>
      </form>
    </Form>
  );
}
