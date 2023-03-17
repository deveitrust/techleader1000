using Abp.Dependency;

namespace DT.Messenger.App.MessengerServices.NodeClient
{
    internal interface INodeAppController : INodeAppsBase, ISingletonDependency
    {
    }
}
