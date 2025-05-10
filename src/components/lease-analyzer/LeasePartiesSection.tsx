
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, Info } from "lucide-react";

interface Parties {
  landlord: string;
  tenants: string[];
  jointAndSeveralLiability: boolean;
}

interface LeasePartiesSectionProps {
  parties: Parties;
}

export function LeasePartiesSection({ parties }: LeasePartiesSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Users className="h-5 w-5" /> Lease Parties
          </CardTitle>
          <CardDescription>Who's involved in this agreement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-cyan-400">Landlord/Property Manager</h4>
              <p className="text-cyan-100/90 bg-cyan-950/40 p-3 rounded-lg">{parties.landlord}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-cyan-400">Tenant(s)</h4>
              <div className="bg-cyan-950/40 p-3 rounded-lg">
                {parties.tenants && parties.tenants.length > 0 ? (
                  <ul className="space-y-1">
                    {parties.tenants.map((tenant, index) => (
                      <li key={index} className="text-cyan-100/90">• {tenant}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-cyan-100/90">No tenants specified</p>
                )}
              </div>
            </div>
          </div>
          
          {parties.jointAndSeveralLiability && (
            <div className="mt-6 p-4 bg-amber-950/20 border border-amber-400/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-400 mb-1">Joint and Several Liability</h4>
                <p className="text-sm text-amber-300/90">
                  This lease has a joint and several liability clause. This means each tenant is responsible
                  for the full rent and any damages, even if caused by other tenants. If one roommate moves out
                  or doesn't pay, the others must cover their share.
                </p>
              </div>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-950/30 border border-blue-400/20 rounded-lg flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-300/90">
              Keep contact information for your landlord/property manager in a safe place. 
              All communication about maintenance, issues, or lease questions should be directed to them.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
