using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Abp.Application.Features;
using Abp.Authorization.Users;
using Abp.Domain.Repositories;
using DT.Messenger.App.MessengerServices.Dto;
using DT.Messenger.Core.Hosting;
using DT.Messenger.Core.NodeServer.Auth;
using DT.Messenger.Intercommunication;
using DT.Messenger.Intercommunication.Authentication.Dto;
using DT.Messenger.Intercommunication.Authentication.Interfaces;
using DT.Messenger.Messengers.Accounts;
using DT.Messenger.Messengers.Hosting;
using Microsoft.Extensions.Configuration;

namespace DT.Messenger.App.MessengerServices.NodeClient.Apps
{
    internal sealed class NodeApps : INodeApps
    {
        public NodeApps(
            IHubHosting hubHosting,
            IFeatureManager featureManager,
            IFeatureChecker featureChecker,
            IInstanceHosting instanceHosting,
            IConfigurationRoot configurationRoot,
            IMessengerAccountFacade messengerAccounts,
            IRepository<UserLoginAttempt, long> userLoginAttemptRepository
			)
        {
            _featureManager = featureManager;
            _featureChecker = featureChecker;
            _messengerAccounts = messengerAccounts;
            _hubHosting = hubHosting;
            _instanceHosting = instanceHosting;
            _configurationRoot = configurationRoot;
            _userLoginAttemptRepository = userLoginAttemptRepository;
        }

        private readonly IHubHosting _hubHosting;
        private readonly IFeatureManager _featureManager;
        private readonly IFeatureChecker _featureChecker;
        private readonly IInstanceHosting _instanceHosting;
        private readonly IConfigurationRoot _configurationRoot;
        private readonly IMessengerAccountFacade _messengerAccounts;
        private readonly IRepository<UserLoginAttempt, long> _userLoginAttemptRepository;

        public Task<KeepAliveResult> KeepNodeAliveAsync(IPAddress nodePublicIpAddress)
        {
            return _instanceHosting.KeepNodeAliveAsync(nodePublicIpAddress);
        }

        public async Task<ResolveNodeOutputDto> GetTargetNodeUrl(long userId)
        {
            // get last user login ip address
            var userIpAddress = _userLoginAttemptRepository
                .GetAll()
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.CreationTime)
                .Select(e => e.ClientIpAddress)
                .First();

            var nodeInstance = await _hubHosting.GetHubByUserIpAsync(
                IPAddress.Parse(userIpAddress)
                );

            return new ResolveNodeOutputDto
            {
                HubAddress = nodeInstance.Url.ToString(),
            };
        }

        public Task<IMessengerHub> GetHubByUserIpAsync(IPAddress userIpAddress)
        {
            return _hubHosting.GetHubByUserIpAsync(userIpAddress);
        }

        public Task ConnectNodeAsync(IPAddress nodePublicIpAddress, IConnectNodeRequest request)
        {
            return _instanceHosting.ConnectNodeAsync(nodePublicIpAddress, request);
        }

        public async Task<AuthorizationDto> AuthorizeUserAsync(
            IPAddress nodePublicIpAddress,
            int tenantId,
            long userId
        )
        {
            await _instanceHosting.AuthorizeNodeUser(nodePublicIpAddress, userId);

            var features = GetFeatures(tenantId);

            return new AuthorizationDto
            {
                UserId = userId,
                TenantId = tenantId,
                Features = features
            };
        }

        private FeatureDto[] GetFeatures(int tenantId)
        {
            return _featureManager
                .GetAll()
                .Select(f => new FeatureDto
                {
                    Name = f.Name,
                    DefaultValue = f.DefaultValue,
                    // tenant-specific feature value may differ from one defined by edition                    
                    Value = _featureChecker.GetValue(tenantId, f.Name),
                    ParentName = f.Parent?.Name,
				}
                .ToArray();
        }

        public Task DisconnectUserAsync(IPAddress nodePublicIpAddress, long userId)
        {
            return _instanceHosting.DisconnectNodeUser(nodePublicIpAddress, userId);
        }

        public Task UpdateAuthData(IMessengerAuthDataInput authData)
        {
            return _messengerAccounts.UpdateAuthData(authData);
        }

        public Task UpdateLastLoginResult(UpdateLastLoginResultDto lastLoginResultUpdate)
        {
            return _messengerAccounts.UpdateLastLoginResult(lastLoginResultUpdate);
        }

        public Task<MessengerAuthOutputDto[]> GetLoggedInAuthDatas()
        {
            return _messengerAccounts.GetLoggedInAuthDatas();
        }

        public Task<MessengerAuthOutputDto> GetAuthData(int authId)
        {
            return _messengerAccounts.GetAuthData(authId);
        }

        public Task HandleAuthorizationTokenFailed(long userId, string failedBearerToken)
        {
            return _instanceHosting.HandleAuthorizationTokenFailed(userId, failedBearerToken);
        }
    }
}