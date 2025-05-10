
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tool, Droplets, Shield, AlertTriangle } from "lucide-react";

interface Maintenance {
  landlord: string[];
  tenant: string[];
}

interface UtilityResponsibilities {
  landlord: string[];
  tenant: string[];
}

interface Insurance {
  requiredForTenant: boolean;
  minimumCoverage: string;
}

interface Responsibilities {
  maintenance: Maintenance;
  utilities: UtilityResponsibilities;
  insurance: Insurance;
}

interface LeaseResponsibilitiesSectionProps {
  responsibilities: Responsibilities;
}

export function LeaseResponsibilitiesSection({ responsibilities }: LeaseResponsibilitiesSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Tool className="h-5 w-5" /> Maintenance Responsibilities
          </CardTitle>
          <CardDescription>Who is responsible for maintenance and repairs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-cyan-400 mb-3">Landlord Responsible For</h4>
              {responsibilities.maintenance?.landlord && responsibilities.maintenance.landlord.length > 0 ? (
                <ul className="space-y-2">
                  {responsibilities.maintenance.landlord.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-400 mt-2"></div>
                      <span className="text-cyan-100/90">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-cyan-100/90">No specified landlord maintenance responsibilities</p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-cyan-400 mb-3">Tenant Responsible For</h4>
              {responsibilities.maintenance?.tenant && responsibilities.maintenance.tenant.length > 0 ? (
                <ul className="space-y-2">
                  {responsibilities.maintenance.tenant.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-400 mt-2"></div>
                      <span className="text-cyan-100/90">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-cyan-100/90">No specified tenant maintenance responsibilities</p>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-cyan-950/40 rounded-lg">
            <p className="text-sm text-cyan-100/90">
              <strong>Important:</strong> Even if your lease assigns certain maintenance tasks to you,
              landlords generally remain responsible for maintaining habitable conditions under local 
              housing laws. If there's an issue affecting safety or habitability, contact your landlord immediately.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Droplets className="h-5 w-5" /> Utility Responsibilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-cyan-400 mb-3">Landlord Pays</h4>
              {responsibilities.utilities?.landlord && responsibilities.utilities.landlord.length > 0 ? (
                <ul className="space-y-2">
                  {responsibilities.utilities.landlord.map((utility, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-400 mt-2"></div>
                      <span className="text-cyan-100/90">{utility}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-cyan-100/90">No landlord-paid utilities specified</p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-cyan-400 mb-3">Tenant Pays</h4>
              {responsibilities.utilities?.tenant && responsibilities.utilities.tenant.length > 0 ? (
                <ul className="space-y-2">
                  {responsibilities.utilities.tenant.map((utility, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-400 mt-2"></div>
                      <span className="text-cyan-100/90">{utility}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-cyan-100/90">No tenant-paid utilities specified</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Shield className="h-5 w-5" /> Insurance Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <div className="p-4 bg-cyan-950/40 rounded-lg">
              <h4 className="font-medium text-cyan-400">Renter's Insurance</h4>
              <div className="mt-3">
                {responsibilities.insurance?.requiredForTenant ? (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-cyan-100/90">Required by lease</p>
                      {responsibilities.insurance.minimumCoverage && (
                        <p className="text-sm text-cyan-400/80 mt-1">
                          Minimum coverage: {responsibilities.insurance.minimumCoverage}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-400 mt-2"></div>
                    <p className="text-cyan-100/90">Not required by lease (but still recommended)</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-950/30 border border-blue-400/20 rounded-lg">
              <p className="text-sm text-blue-300/90">
                <strong>Recommendation:</strong> Even if not required, renter's insurance is generally affordable
                (typically $15-30 per month) and protects your belongings from theft, fire, and other
                damages. It also provides liability coverage if someone is injured in your unit.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
