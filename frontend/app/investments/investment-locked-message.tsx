import { BiLockAlt } from 'react-icons/bi';
import { Button } from '../button';
import { createCheckoutSession } from '../stripe/client';

type InvestmentIsLockedMessageProps = {
};

export const InvestmentIsLockedMessage: React.FC<InvestmentIsLockedMessageProps> = ({
}) => {
    return (
      <div className="border border-4 border-black p-4 mb-4">
        <div className="flex items-center">
          <div className="mr-4">
            <BiLockAlt size={32} />
          </div>
          <div className="font-bold">This investment is locked. Upgrade to Premium to unlock it.</div>
        </div>
        <div className="mt-4">
          <Button className="w-full sm:w-auto" variant="primary" onClick={createCheckoutSession}>
            Upgrade to Premium
          </Button>
        </div>
      </div>
    );
}