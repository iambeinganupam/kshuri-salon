import { Card, CardContent } from "../card";
import { Badge } from "../badge";
import { FadeIn } from "../motion";
import {
  MapPin,
  Clock,
  Wifi,
  Car,
  CreditCard,
  Accessibility,
  Sparkles,
  Users,
} from "lucide-react";
import type { VendorProfile } from "./types";

/**
 * A single team member rendered in the "Meet Our Team" grid. Salon vendors
 * supply their staff roster here; freelancers can pass `team={[]}` to skip
 * the section entirely.
 */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo: string;
  /** Lifetime services rendered, displayed under the role. Optional. */
  service_history?: number;
  verified?: boolean;
}

interface AboutTabProps {
  vendor: VendorProfile;
  team: TeamMember[];
}

const amenities = [
  { icon: Wifi, label: "Free Wi-Fi" },
  { icon: Car, label: "Parking Available" },
  { icon: CreditCard, label: "Card Payments" },
  { icon: Accessibility, label: "Wheelchair Access" },
  { icon: Sparkles, label: "AC Salon" },
  { icon: Users, label: "Private Rooms" },
];

const hours = [
  { day: "Monday – Friday", time: "9:00 AM – 9:00 PM" },
  { day: "Saturday", time: "8:00 AM – 10:00 PM" },
  { day: "Sunday", time: "10:00 AM – 7:00 PM" },
];

export default function AboutTab({ vendor, team }: AboutTabProps) {
  return (
    <FadeIn>
      {/* About Text */}
      <div className="mb-8">
        <h2 className="text-xl font-bold font-serif mb-3">About {vendor.display_name}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {vendor.display_name} has been a trusted name in premium beauty services for over 5 years,
          serving the heart of Bangalore. Specializing in bridal packages, hair care, and skin
          treatments, we bring a fusion of traditional Indian artistry and modern techniques.
          Our team of verified professionals ensures every client receives personalized attention
          and exceptional results. We use only premium, dermatologist-tested products and offer
          consultations for destination weddings across India.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { value: "5+", label: "Years Experience", sub: "Since 2021" },
          { value: `${(vendor.rating_count * 3).toLocaleString("en-IN")}+`, label: "Bookings Done", sub: "And counting" },
          { value: `${vendor.rating_avg ?? 0}`, label: "Average Rating", sub: "Out of 5.0" },
          { value: `${vendor.rating_count}`, label: "Happy Reviews", sub: "Verified clients" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-serif text-primary">{stat.value}</p>
              <p className="text-xs font-semibold mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Operating Hours */}
      <div className="mb-8">
        <h3 className="text-lg font-bold font-serif mb-3 flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-primary" />
          Operating Hours
        </h3>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="space-y-2.5">
              {hours.map((h) => (
                <div key={h.day} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{h.day}</span>
                  <span className="text-muted-foreground">{h.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Amenities */}
      <div className="mb-8">
        <h3 className="text-lg font-bold font-serif mb-3">What this place offers</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {amenities.map((amenity) => (
            <div key={amenity.label} className="flex items-center gap-3 py-2.5">
              <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                <amenity.icon className="h-4.5 w-4.5 text-muted-foreground" />
              </div>
              <span className="text-sm">{amenity.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="mb-8">
        <h3 className="text-lg font-bold font-serif mb-3 flex items-center gap-2">
          <MapPin className="h-4.5 w-4.5 text-primary" />
          Location
        </h3>
        <Card className="border-border/60 overflow-hidden">
          <div className="h-48 bg-muted/30 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">{vendor.address_full}</p>
              <p className="text-xs text-muted-foreground mt-1">Map integration coming soon</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Team */}
      {team.length > 0 && (
        <div>
          <h3 className="text-lg font-bold font-serif mb-4 flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-primary" />
            Meet Our Team
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {team.map((member) => (
              <Card key={member.id} className="border-border/60 overflow-hidden group hover:shadow-md transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-3 text-center">
                  <p className="text-sm font-semibold truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                  {member.service_history != null && (
                    <div className="flex items-center justify-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <span>{member.service_history} services</span>
                    </div>
                  )}
                  {member.verified && (
                    <Badge className="mt-1.5 bg-success/10 text-success text-[10px] border-0">
                      ✓ Verified
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </FadeIn>
  );
}
