export default function (view) {
    const AllowMovieShowConfig = {
        pluginUniqueId: '4ce5e570-aeba-4218-a0f8-741cd5701ec6',
        selectedHiddenItems: [],
        selectedToUnhideItemIds: [],
        allMovies: [],
        allShows: [],

        normalizeId: function (id) {
            if (!id) {
                return '';
            }

            return String(id).replace(/-/g, '').toLowerCase();
        },

        idsEqual: function (a, b) {
            return AllowMovieShowConfig.normalizeId(a) === AllowMovieShowConfig.normalizeId(b);
        },

        user: {
            loadUsers: async function () {
                const users = await window.ApiClient.getUsers();
                const selectElement = document.getElementById('userToConfigure');
                selectElement.innerHTML = '';

                for (const user of users) {
                    const option = document.createElement('option');
                    option.value = user.Id;
                    option.textContent = user.Name;
                    selectElement.appendChild(option);
                }
            },
            getSelectedUserId: function () {
                return document.getElementById('userToConfigure').value;
            },
            getSelectedUserName: function () {
                const select = document.getElementById('userToConfigure');
                return select.selectedOptions[0]?.text ?? '';
            }
        },

        init: async function () {
            await this.user.loadUsers();
            await this.loadConfig();

            document.getElementById('userToConfigure').addEventListener('change', this.loadConfig);
            document.getElementById('saveButton').addEventListener('click', this.saveConfig);
            document.getElementById('applyNowButton').addEventListener('click', this.applyNow);
        },

        loadConfig: async function () {
            Dashboard.showLoadingMsg();
            try {
                const config = await ApiClient.getPluginConfiguration(AllowMovieShowConfig.pluginUniqueId);
                document.querySelector('#EnablePlugin').checked = config.EnablePlugin;
                const userConfig = config.UserRules.find(x => x.UserId === AllowMovieShowConfig.user.getSelectedUserId());
                const hiddenItemIds = userConfig?.HiddenItemIds || [];
                const hiddenItems = userConfig?.HiddenItems || [];
                if (hiddenItems.length > 0) {
                    AllowMovieShowConfig.selectedHiddenItems = hiddenItems.map(x => ({
                        Id: x.ItemId,
                        Name: x.Name || `Unknown item (${x.ItemId})`,
                        Type: x.ItemType || 'Unknown'
                    }));
                } else {
                    AllowMovieShowConfig.selectedHiddenItems = await AllowMovieShowConfig.resolveHiddenItems(hiddenItemIds);
                }

                await AllowMovieShowConfig.refreshUnknownHiddenNames();
                AllowMovieShowConfig.selectedToUnhideItemIds = [];
                await AllowMovieShowConfig.loadAllMedia();
                AllowMovieShowConfig.renderHiddenItemsSection();
                AllowMovieShowConfig.renderAllMediaSections();
            } finally {
                Dashboard.hideLoadingMsg();
            }
        },

        loadAllMedia: async function () {
            const userId = AllowMovieShowConfig.user.getSelectedUserId();
            const [movieResult, showResult] = await Promise.all([
                ApiClient.getItems(userId, {
                    Recursive: true,
                    IncludeItemTypes: 'Movie',
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                    Limit: 10000
                }),
                ApiClient.getItems(userId, {
                    Recursive: true,
                    IncludeItemTypes: 'Series',
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                    Limit: 10000
                })
            ]);

            AllowMovieShowConfig.allMovies = movieResult?.Items || [];
            AllowMovieShowConfig.allShows = showResult?.Items || [];
        },

        renderAllMediaSections: function () {
            AllowMovieShowConfig.renderMediaList('movieItemsContainer', AllowMovieShowConfig.allMovies);
            AllowMovieShowConfig.renderMediaList('showItemsContainer', AllowMovieShowConfig.allShows);
        },

        refreshUnknownHiddenNames: async function () {
            const stale = AllowMovieShowConfig.selectedHiddenItems.filter(
                x => !x.Name || x.Name.startsWith('Unknown item') || !x.Type || x.Type === 'Unknown'
            );
            if (stale.length === 0) {
                return;
            }

            const resolved = await AllowMovieShowConfig.resolveHiddenItems(stale.map(x => x.Id));
            const map = new Map(resolved.map(x => [AllowMovieShowConfig.normalizeId(x.Id), x]));
            for (const item of AllowMovieShowConfig.selectedHiddenItems) {
                const r = map.get(AllowMovieShowConfig.normalizeId(item.Id));
                if (r && r.Name && !r.Name.startsWith('Unknown')) {
                    item.Name = r.Name;
                    item.Type = r.Type;
                    item.Id = r.Id;
                }
            }
        },

        renderHiddenItemsSection: function () {
            const container = document.getElementById('hiddenItemsContainer');
            container.innerHTML = '';

            if (!AllowMovieShowConfig.selectedHiddenItems || AllowMovieShowConfig.selectedHiddenItems.length === 0) {
                container.innerHTML = '<div class="fieldDescription">No hidden items for this user.</div>';
                return;
            }

            for (const item of AllowMovieShowConfig.selectedHiddenItems) {
                const row = document.createElement('label');
                row.className = 'checkboxContainer';
                row.style.marginBottom = '0.4em';
                const isSelectedToUnhide = AllowMovieShowConfig.selectedToUnhideItemIds.some(
                    x => AllowMovieShowConfig.idsEqual(x, item.Id)
                );

                row.innerHTML = `
                    <input type="checkbox" is="emby-checkbox" ${isSelectedToUnhide ? 'checked' : ''} data-itemid="${item.Id}" />
                    <span>${item.Name} (${item.Type})</span>
                `;

                row.querySelector('input').addEventListener('change', function (event) {
                    if (event.target.checked) {
                        if (!AllowMovieShowConfig.selectedToUnhideItemIds.some(x => AllowMovieShowConfig.idsEqual(x, item.Id))) {
                            AllowMovieShowConfig.selectedToUnhideItemIds.push(AllowMovieShowConfig.normalizeId(item.Id));
                        }
                    } else {
                        AllowMovieShowConfig.selectedToUnhideItemIds = AllowMovieShowConfig.selectedToUnhideItemIds.filter(
                            x => !AllowMovieShowConfig.idsEqual(x, item.Id)
                        );
                    }
                });

                container.appendChild(row);
            }
        },

        renderMediaList: function (containerId, items) {
            const container = document.getElementById(containerId);
            container.innerHTML = '';

            if (!items || items.length === 0) {
                container.innerHTML = '<div class="fieldDescription">No items found.</div>';
                return;
            }

            for (const item of items) {
                const isSelected = AllowMovieShowConfig.selectedHiddenItems.some(x => AllowMovieShowConfig.idsEqual(x.Id, item.Id));
                const row = document.createElement('label');
                row.className = 'checkboxContainer';
                row.style.marginBottom = '0.4em';

                row.innerHTML = `
                    <input type="checkbox" is="emby-checkbox" ${isSelected ? 'checked' : ''} data-itemid="${item.Id}" />
                    <span>${item.Name}</span>
                `;

                row.querySelector('input').addEventListener('change', function (event) {
                    if (event.target.checked) {
                        AllowMovieShowConfig.addSelectedItem(item);
                    } else {
                        AllowMovieShowConfig.removeSelectedItem(item.Id);
                    }
                });

                container.appendChild(row);
            }
        },

        addSelectedItem: function (item) {
            if (AllowMovieShowConfig.selectedHiddenItems.some(x => AllowMovieShowConfig.idsEqual(x.Id, item.Id))) {
                return;
            }

            AllowMovieShowConfig.selectedHiddenItems.push({
                Id: item.Id,
                Name: item.Name,
                Type: item.Type
            });
            AllowMovieShowConfig.selectedToUnhideItemIds = AllowMovieShowConfig.selectedToUnhideItemIds.filter(
                x => !AllowMovieShowConfig.idsEqual(x, item.Id)
            );
            AllowMovieShowConfig.renderHiddenItemsSection();
            AllowMovieShowConfig.renderAllMediaSections();
        },

        removeSelectedItem: function (itemId) {
            AllowMovieShowConfig.selectedHiddenItems = AllowMovieShowConfig.selectedHiddenItems.filter(
                x => !AllowMovieShowConfig.idsEqual(x.Id, itemId)
            );
            AllowMovieShowConfig.selectedToUnhideItemIds = AllowMovieShowConfig.selectedToUnhideItemIds.filter(
                x => !AllowMovieShowConfig.idsEqual(x, itemId)
            );
            AllowMovieShowConfig.renderHiddenItemsSection();
            AllowMovieShowConfig.renderAllMediaSections();
        },

        resolveHiddenItems: async function (itemIds) {
            const normalizedIds = (itemIds || []).filter(x => !!x);
            if (normalizedIds.length === 0) {
                return [];
            }

            const url = new URL('/AllowMovieShowApi/ResolveItems', window.location.origin);
            url.searchParams.set('ids', normalizedIds.join(','));

            try {
                const response = await fetch(url.toString());
                if (!response.ok) {
                    throw new Error('Resolve items request failed');
                }

                const resolvedItems = await response.json();
                const resolvedMap = new Map(
                    (resolvedItems || []).map(x => [AllowMovieShowConfig.normalizeId(x.Id), x])
                );
                return normalizedIds.map(id => {
                    const resolved = resolvedMap.get(AllowMovieShowConfig.normalizeId(id));
                    if (resolved) {
                        return { Id: resolved.Id, Name: resolved.Name, Type: resolved.Type };
                    }

                    return { Id: AllowMovieShowConfig.normalizeId(id), Name: `Unknown item (${id})`, Type: 'Unknown' };
                });
            } catch (error) {
                return normalizedIds.map(id => ({
                    Id: AllowMovieShowConfig.normalizeId(id),
                    Name: `Unknown item (${id})`,
                    Type: 'Unknown'
                }));
            }
        },

        saveConfig: function (e = null) {
            if (e) {
                e.preventDefault();
            }

            Dashboard.showLoadingMsg();
            ApiClient.getPluginConfiguration(AllowMovieShowConfig.pluginUniqueId).then(function (config) {
                config.EnablePlugin = document.querySelector('#EnablePlugin').checked;

                const selectedUserId = AllowMovieShowConfig.user.getSelectedUserId();
                const selectedUserName = AllowMovieShowConfig.user.getSelectedUserName();
                const userConfig = config.UserRules.find(x => x.UserId === selectedUserId);
                const hiddenItems = AllowMovieShowConfig.selectedHiddenItems
                    .filter(
                        item => !AllowMovieShowConfig.selectedToUnhideItemIds.some(u => AllowMovieShowConfig.idsEqual(u, item.Id))
                    )
                    .map(item => ({
                        ItemId: item.Id,
                        Name: item.Name,
                        ItemType: item.Type
                    }));
                const hiddenItemIds = hiddenItems
                    .map(x => x.ItemId)
                    .filter(id => !!id);

                if (userConfig) {
                    userConfig.HiddenItemIds = hiddenItemIds;
                    userConfig.HiddenItems = hiddenItems;
                } else {
                    config.UserRules.push({
                        UserId: selectedUserId,
                        UserName: selectedUserName,
                        HiddenItemIds: hiddenItemIds,
                        HiddenItems: hiddenItems
                    });
                }

                ApiClient.updatePluginConfiguration(AllowMovieShowConfig.pluginUniqueId, config)
                    .then(function (result) {
                        Dashboard.processPluginConfigurationUpdateResult(result);
                        return AllowMovieShowConfig.callApplyNow();
                    })
                    .then(function () {
                        Dashboard.alert({
                            title: 'Allow Movie Show',
                            message: 'Saved and applied immediately.'
                        });
                    })
                    .catch(function () {
                        Dashboard.alert({
                            title: 'Allow Movie Show',
                            message: 'Saved configuration, but apply-now failed. You can click Apply now button or restart Jellyfin.'
                        });
                    });
            });
        },

        applyNow: function (e = null) {
            if (e) {
                e.preventDefault();
            }

            AllowMovieShowConfig.callApplyNow()
                .then(function () {
                    Dashboard.alert({
                        title: 'Allow Movie Show',
                        message: 'Rules applied immediately without restart.'
                    });
                })
                .catch(function () {
                    Dashboard.alert({
                        title: 'Allow Movie Show',
                        message: 'Apply now failed. Please check Jellyfin logs.'
                    });
                });
        },

        callApplyNow: async function () {
            const response = await fetch('/AllowMovieShowApi/ApplyNow', {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Apply now failed');
            }
        }
    };

    view.addEventListener('viewshow', async function () {
        await AllowMovieShowConfig.init();
    });
}
