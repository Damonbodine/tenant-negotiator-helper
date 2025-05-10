
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, AlertTriangle, Info } from "lucide-react";

interface LateFee {
  amount: number;
  gracePeriod: number;
  type: string;
}

interface OtherFee {
  type: string;
  amount: number;
  frequency: string;
}

interface Rent {
  amount: number;
  frequency: string;
}

interface Utilities {
  included: string[];
  tenant: string[];
}

interface Financial {
  rent: Rent;
  securityDeposit: number;
  lateFee: LateFee;
  utilities: Utilities;
  otherFees: OtherFee[];
}

interface LeaseFinancialSectionProps {
  financial: Financial;
}

export function LeaseFinancialSection({ financial }: LeaseFinancialSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Calculate estimated monthly costs
  const calculateMonthlyCost = () => {
    let total = financial.rent.frequency === 'monthly' ? financial.rent.amount : financial.rent.amount / 12;
    
    // Add any monthly fees
    financial.otherFees.forEach(fee => {
      if (fee.frequency === 'monthly') {
        total += fee.amount;
      }
    });
    
    return formatCurrency(total);
  };

  // Calculate estimated yearly costs
  const calculateYearlyCost = () => {
    let total = financial.rent.frequency === 'yearly' ? financial.rent.amount : financial.rent.amount * 12;
    
    // Add security deposit (one-time cost)
    total += financial.securityDeposit;
    
    // Add all fees based on their frequency
    financial.otherFees.forEach(fee => {
      if (fee.frequency === 'yearly') {
        total += fee.amount;
      } else if (fee.frequency === 'monthly') {
        total += fee.amount * 12;
      } else if (fee.frequency === 'one-time') {
        total += fee.amount;
      }
    });
    
    return formatCurrency(total);
  };

  return (
    <div className="space-y-6">
      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <DollarSign className="h-5 w-5" /> Core Financial Information
          </CardTitle>
          <CardDescription>Key financial details from your lease</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-cyan-400/80">Monthly Rent</h4>
                <p className="text-2xl font-bold text-cyan-400">{formatCurrency(financial.rent.amount)}</p>
                <p className="text-sm text-cyan-400/60">Due {financial.rent.frequency}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-cyan-400/80">Security Deposit</h4>
                <p className="text-2xl font-bold text-cyan-400">{formatCurrency(financial.securityDeposit)}</p>
                <p className="text-sm text-cyan-400/60">One-time payment</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-cyan-400/80 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> Late Fee
                </h4>
                <p className="text-xl font-bold text-cyan-400">
                  {financial.lateFee.type === 'fixed' 
                    ? formatCurrency(financial.lateFee.amount) 
                    : `${financial.lateFee.amount}% of rent`}
                </p>
                <p className="text-sm text-cyan-400/60">
                  {financial.lateFee.gracePeriod} day grace period
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-cyan-400/80">Utilities Included</h4>
                {financial.utilities.included && financial.utilities.included.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {financial.utilities.included.map((utility, index) => (
                      <li key={index} className="text-cyan-100/90 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-400"></div>
                        {utility}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-cyan-100/90">No utilities included</p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-cyan-400/80">Tenant Pays</h4>
                {financial.utilities.tenant && financial.utilities.tenant.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {financial.utilities.tenant.map((utility, index) => (
                      <li key={index} className="text-cyan-100/90 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                        {utility}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-cyan-100/90">No tenant-paid utilities specified</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {financial.otherFees && financial.otherFees.length > 0 && (
        <Card className="border-cyan-400/30 bg-cyan-950/20">
          <CardHeader>
            <CardTitle className="text-cyan-400">Additional Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {financial.otherFees.map((fee, index) => (
                <div key={index} className="flex justify-between items-center border-b border-cyan-400/20 pb-2 last:border-b-0 last:pb-0">
                  <div>
                    <h4 className="font-medium text-cyan-400">{fee.type} Fee</h4>
                    <p className="text-sm text-cyan-400/60">{fee.frequency}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-cyan-400">{formatCurrency(fee.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-cyan-400/30 bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <BarChart3 className="h-5 w-5" /> Cost Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-cyan-950/40 rounded-lg text-center">
              <p className="text-sm text-cyan-400/80">Estimated Monthly Cost</p>
              <p className="text-3xl font-bold text-cyan-400 my-2">{calculateMonthlyCost()}</p>
              <p className="text-xs text-cyan-400/60">Includes rent and monthly fees</p>
            </div>
            
            <div className="p-4 bg-cyan-950/40 rounded-lg text-center">
              <p className="text-sm text-cyan-400/80">First Year Total</p>
              <p className="text-3xl font-bold text-cyan-400 my-2">{calculateYearlyCost()}</p>
              <p className="text-xs text-cyan-400/60">Includes deposit and all fees</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-950/30 border border-blue-400/20 rounded-lg flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-300/90">
              These projections are estimates based on your lease terms. Actual costs may vary based on
              utility usage, additional fees, and changes to rent over time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
