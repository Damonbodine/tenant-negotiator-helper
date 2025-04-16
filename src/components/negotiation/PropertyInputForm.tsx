
import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dices } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PropertyDetails } from "./types";
import { generateRandomProperty } from "@/utils/randomPropertyGenerator";

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

export function PropertyInputForm({ onSubmit, isLoading }: PropertyInputFormProps) {
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

  const handleGenerateRandom = () => {
    const randomProperty = generateRandomProperty();
    form.reset(randomProperty);
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
                <Input placeholder="123 Main St" {...form.register("address")} />
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
