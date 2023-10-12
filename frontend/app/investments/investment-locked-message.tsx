import { BiLockAlt } from 'react-icons/bi';

type InvestmentIsLockedMessageProps = {
};

export const InvestmentIsLockedMessage: React.FC<InvestmentIsLockedMessageProps> = ({
}) => {
    return (
      <div className="border border-4 border-black flex p-4 mb-4">
        <div className="mr-4">
          <BiLockAlt size={32} />
        </div>
        <div className="font-bold">
          This investment is locked. Upgrade to Premium to unlock it.
        </div>
      </div>
    );
}